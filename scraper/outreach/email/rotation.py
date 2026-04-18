"""Email rotation system with health monitoring."""

import asyncio
import random
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from outreach.database.models import EmailAccount, EmailAccountStatus, EmailSent
from outreach.database import get_db_session
from outreach.config import settings


@dataclass
class EmailAccountHealth:
    """Health metrics for an email account."""
    account_id: int
    email: str
    status: EmailAccountStatus
    daily_limit: int
    sent_today: int
    remaining: int
    bounce_rate: float
    spam_rate: float
    overall_score: float
    recommendation: str


class EmailRotationSystem:
    """Manages email account rotation and health."""
    
    def __init__(self):
        self.accounts: List[EmailAccount] = []
        self.last_refresh: Optional[datetime] = None
        self.rotation_index: int = 0
    
    async def refresh_accounts(self):
        """Refresh account list from database."""
        async with get_db_session() as session:
            result = await session.execute(
                select(EmailAccount).where(
                    EmailAccount.status.in_([
                        EmailAccountStatus.ACTIVE,
                        EmailAccountStatus.WARMING
                    ])
                )
            )
            self.accounts = result.scalars().all()
            self.last_refresh = datetime.utcnow()
    
    def _calculate_health_score(self, account: EmailAccount) -> float:
        """Calculate health score for an account (0-100)."""
        score = 100.0
        
        # Deduct for bounces
        if account.emails_sent_total > 0:
            bounce_rate = account.bounce_count / account.emails_sent_total
            score -= bounce_rate * 50  # Max 50 point deduction
            
            spam_rate = account.spam_count / account.emails_sent_total
            score -= spam_rate * 50  # Max 50 point deduction
        
        # Deduct for being close to limit
        usage_ratio = account.emails_sent_today / account.daily_limit
        score -= usage_ratio * 10
        
        return max(0, min(100, score))
    
    async def get_account_health(
        self,
        account_id: int
    ) -> Optional[EmailAccountHealth]:
        """Get health metrics for an account."""
        async with get_db_session() as session:
            account = await session.get(EmailAccount, account_id)
            if not account:
                return None
            
            bounce_rate = 0.0
            spam_rate = 0.0
            if account.emails_sent_total > 0:
                bounce_rate = account.bounce_count / account.emails_sent_total
                spam_rate = account.spam_count / account.emails_sent_total
            
            score = self._calculate_health_score(account)
            
            # Generate recommendation
            if score < 50:
                recommendation = "PAUSE - High bounce/spam rate"
            elif score < 70:
                recommendation = "WARNING - Monitor closely"
            elif account.emails_sent_today >= account.daily_limit * 0.9:
                recommendation = "LIMIT - Near daily cap"
            else:
                recommendation = "HEALTHY - Good to send"
            
            return EmailAccountHealth(
                account_id=account.id,
                email=account.email,
                status=account.status,
                daily_limit=account.daily_limit,
                sent_today=account.emails_sent_today,
                remaining=account.daily_limit - account.emails_sent_today,
                bounce_rate=bounce_rate,
                spam_rate=spam_rate,
                overall_score=score,
                recommendation=recommendation
            )
    
    async def get_next_account(self) -> Optional[EmailAccount]:
        """Get next available account using round-robin with health weighting."""
        if not self.accounts or (
            self.last_refresh and 
            datetime.utcnow() - self.last_refresh > timedelta(minutes=5)
        ):
            await self.refresh_accounts()
        
        if not self.accounts:
            return None
        
        # Filter accounts with remaining capacity
        available = [
            acc for acc in self.accounts
            if acc.emails_sent_today < acc.daily_limit
            and acc.status in [EmailAccountStatus.ACTIVE, EmailAccountStatus.WARMING]
        ]
        
        if not available:
            return None
        
        # Weight by health score (higher score = more likely to be selected)
        weights = [self._calculate_health_score(acc) for acc in available]
        total_weight = sum(weights)
        
        if total_weight == 0:
            # All accounts have 0 health, use random
            return random.choice(available)
        
        # Weighted random selection
        r = random.uniform(0, total_weight)
        cumulative = 0
        for acc, weight in zip(available, weights):
            cumulative += weight
            if r <= cumulative:
                return acc
        
        return available[-1]
    
    async def mark_email_sent(self, account_id: int):
        """Mark an email as sent from an account."""
        async with get_db_session() as session:
            await session.execute(
                update(EmailAccount)
                .where(EmailAccount.id == account_id)
                .values(
                    emails_sent_today=EmailAccount.emails_sent_today + 1,
                    emails_sent_total=EmailAccount.emails_sent_total + 1,
                    last_sent_at=datetime.utcnow()
                )
            )
    
    async def report_bounce(self, account_id: int):
        """Report a bounced email."""
        async with get_db_session() as session:
            account = await session.get(EmailAccount, account_id)
            if account:
                account.bounce_count += 1
                
                # Auto-pause if bounce rate gets too high
                if account.emails_sent_total > 50:
                    bounce_rate = account.bounce_count / account.emails_sent_total
                    if bounce_rate > 0.05:  # 5% bounce rate threshold
                        account.status = EmailAccountStatus.PAUSED
    
    async def report_spam(self, account_id: int):
        """Report a spam complaint."""
        async with get_db_session() as session:
            account = await session.get(EmailAccount, account_id)
            if account:
                account.spam_count += 1
                
                # Auto-pause on any spam complaint
                if account.spam_count > 0:
                    account.status = EmailAccountStatus.PAUSED
    
    async def get_all_health_status(self) -> List[EmailAccountHealth]:
        """Get health status for all accounts."""
        await self.refresh_accounts()
        
        health_statuses = []
        for account in self.accounts:
            health = await self.get_account_health(account.id)
            if health:
                health_statuses.append(health)
        
        return sorted(health_statuses, key=lambda x: x.overall_score, reverse=True)
    
    async def pause_account(self, account_id: int, reason: str = "manual"):
        """Pause an email account."""
        async with get_db_session() as session:
            account = await session.get(EmailAccount, account_id)
            if account:
                account.status = EmailAccountStatus.PAUSED
                print(f"Account {account.email} paused: {reason}")
    
    async def resume_account(self, account_id: int):
        """Resume a paused email account."""
        async with get_db_session() as session:
            account = await session.get(EmailAccount, account_id)
            if account and account.status == EmailAccountStatus.PAUSED:
                account.status = EmailAccountStatus.ACTIVE
                print(f"Account {account.email} resumed")


class EmailAccountPool:
    """Manages a pool of email accounts for high-volume sending."""
    
    def __init__(self, target_daily_volume: int = 1000):
        self.target_volume = target_daily_volume
        self.rotation = EmailRotationSystem()
    
    async def calculate_required_accounts(self) -> int:
        """Calculate how many accounts needed for target volume."""
        # With 50 emails/day per account after warm-up
        emails_per_account = 50
        return max(15, (self.target_volume // emails_per_account) + 1)
    
    async def get_sending_capacity(self) -> Dict[str, Any]:
        """Get current sending capacity."""
        health_statuses = await self.rotation.get_all_health_status()
        
        total_remaining = sum(h.remaining for h in health_statuses)
        healthy_accounts = sum(1 for h in health_statuses if h.overall_score >= 70)
        
        return {
            "total_accounts": len(health_statuses),
            "healthy_accounts": healthy_accounts,
            "daily_capacity": total_remaining,
            "target_volume": self.target_volume,
            "capacity_ratio": total_remaining / self.target_volume if self.target_volume > 0 else 0
        }
