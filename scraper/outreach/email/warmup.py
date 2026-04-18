"""Email warm-up protocol implementation."""

import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from outreach.database.models import EmailAccount, EmailAccountStatus
from outreach.database import get_db_session
from outreach.config import settings


class WarmupProtocol:
    """Manages the 14-day email warm-up protocol."""
    
    # Day-by-day warm-up schedule (emails per day)
    DEFAULT_SCHEDULE = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 50, 50, 50, 50]
    
    def __init__(self, schedule: Optional[List[int]] = None):
        self.schedule = schedule or settings.warmup_schedule or self.DEFAULT_SCHEDULE
    
    def get_day_limit(self, day: int) -> int:
        """Get email limit for a specific warm-up day."""
        if day < 0:
            return 0
        if day >= len(self.schedule):
            return self.schedule[-1]  # Max limit after warm-up
        return self.schedule[day]
    
    async def initialize_account(self, account_id: int):
        """Initialize a new account for warm-up."""
        async with get_db_session() as session:
            account = await session.get(EmailAccount, account_id)
            if not account:
                return False
            
            account.status = EmailAccountStatus.WARMING
            account.warmup_start_date = datetime.utcnow()
            account.warmup_day = 0
            account.daily_limit = self.schedule[0]
            
            print(f"Account {account.email} initialized for warm-up")
            return True
    
    async def progress_account(self, account_id: int) -> bool:
        """Progress an account to the next warm-up day."""
        async with get_db_session() as session:
            account = await session.get(EmailAccount, account_id)
            if not account:
                return False
            
            if account.status != EmailAccountStatus.WARMING:
                return False
            
            # Increment day
            account.warmup_day += 1
            
            # Update limit based on schedule
            if account.warmup_day < len(self.schedule):
                account.daily_limit = self.schedule[account.warmup_day]
            else:
                # Warm-up complete
                account.status = EmailAccountStatus.ACTIVE
                account.daily_limit = settings.max_daily_emails_per_account
                print(f"Account {account.email} warm-up complete!")
                return True
            
            print(
                f"Account {account.email}: Day {account.warmup_day}, "
                f"limit increased to {account.daily_limit}"
            )
            return True
    
    async def check_and_progress_accounts(self):
        """Check all warming accounts and progress them if needed."""
        async with get_db_session() as session:
            result = await session.execute(
                select(EmailAccount).where(
                    EmailAccount.status == EmailAccountStatus.WARMING
                )
            )
            warming_accounts = result.scalars().all()
        
        for account in warming_accounts:
            if not account.warmup_start_date:
                continue
            
            # Calculate days since start
            days_elapsed = (datetime.utcnow() - account.warmup_start_date).days
            
            # Progress if needed
            while account.warmup_day < days_elapsed and account.warmup_day < len(self.schedule):
                await self.progress_account(account.id)
                
                # Refresh account data
                async with get_db_session() as session:
                    account = await session.get(EmailAccount, account.id)
    
    async def get_warmup_status(self, account_id: int) -> Optional[Dict[str, Any]]:
        """Get warm-up status for an account."""
        async with get_db_session() as session:
            account = await session.get(EmailAccount, account_id)
            if not account:
                return None
            
            if account.status == EmailAccountStatus.ACTIVE:
                return {
                    "email": account.email,
                    "status": "complete",
                    "days_completed": len(self.schedule),
                    "current_limit": account.daily_limit,
                    "progress_percent": 100
                }
            
            if account.status != EmailAccountStatus.WARMING:
                return {
                    "email": account.email,
                    "status": account.status.value,
                    "message": "Account not in warm-up"
                }
            
            days_elapsed = 0
            if account.warmup_start_date:
                days_elapsed = (datetime.utcnow() - account.warmup_start_date).days
            
            progress = min(100, (account.warmup_day / len(self.schedule)) * 100)
            
            return {
                "email": account.email,
                "status": "warming",
                "day": account.warmup_day,
                "days_elapsed": days_elapsed,
                "total_days": len(self.schedule),
                "current_limit": account.daily_limit,
                "max_limit": self.schedule[-1],
                "progress_percent": round(progress, 1),
                "next_increase": (
                    self.schedule[account.warmup_day + 1] 
                    if account.warmup_day + 1 < len(self.schedule) 
                    else None
                )
            }
    
    async def get_all_warmup_status(self) -> List[Dict[str, Any]]:
        """Get warm-up status for all accounts."""
        async with get_db_session() as session:
            result = await session.execute(
                select(EmailAccount).where(
                    EmailAccount.status.in_([
                        EmailAccountStatus.WARMING,
                        EmailAccountStatus.ACTIVE
                    ])
                )
            )
            accounts = result.scalars().all()
        
        statuses = []
        for account in accounts:
            status = await self.get_warmup_status(account.id)
            if status:
                statuses.append(status)
        
        return statuses


class WarmupSimulator:
    """Simulates warm-up by sending emails to seed accounts."""
    
    def __init__(self):
        # List of seed email addresses for warm-up
        # These should be accounts you control
        self.seed_accounts: List[str] = []
    
    def add_seed_account(self, email: str):
        """Add a seed account for warm-up simulation."""
        self.seed_accounts.append(email)
    
    async def send_warmup_email(
        self,
        from_account: EmailAccount,
        to_email: str
    ) -> bool:
        """Send a warm-up email to a seed account."""
        # This would integrate with the email sender
        # For now, just a placeholder
        from outreach.email.sender import EmailSender
        
        sender = EmailSender()
        
        subject = "Quick question"
        body = (
            f"Hi there,\n\n"
            f"Just reaching out to see if you're open to a quick chat "
            f"about your business.\n\n"
            f"Best regards"
        )
        
        try:
            await sender.send_email(
                account=from_account,
                to_email=to_email,
                subject=subject,
                body=body,
                is_warmup=True
            )
            return True
        except Exception as e:
            print(f"Warm-up email failed: {e}")
            return False
    
    async def run_daily_warmup(self):
        """Run daily warm-up for all warming accounts."""
        if not self.seed_accounts:
            print("No seed accounts configured for warm-up")
            return
        
        warmup = WarmupProtocol()
        
        async with get_db_session() as session:
            result = await session.execute(
                select(EmailAccount).where(
                    EmailAccount.status == EmailAccountStatus.WARMING
                )
            )
            warming_accounts = result.scalars().all()
        
        for account in warming_accounts:
            status = await warmup.get_warmup_status(account.id)
            if not status:
                continue
            
            target_count = status["current_limit"]
            
            # Send warm-up emails
            for i in range(target_count):
                seed = random.choice(self.seed_accounts)
                success = await self.send_warmup_email(account, seed)
                
                if success:
                    await asyncio.sleep(5)  # Delay between emails
                else:
                    break


# Daily warm-up schedule progression
WARMUP_SCHEDULE = {
    1: {"daily_limit": 5, "action": "Start slow"},
    2: {"daily_limit": 10, "action": "Double volume"},
    3: {"daily_limit": 15, "action": "Increase by 50%"},
    4: {"daily_limit": 20, "action": "Steady growth"},
    5: {"daily_limit": 25, "action": "Halfway point"},
    6: {"daily_limit": 30, "action": "Building reputation"},
    7: {"daily_limit": 35, "action": "Week 1 complete"},
    8: {"daily_limit": 40, "action": "Strong momentum"},
    9: {"daily_limit": 45, "action": "Almost there"},
    10: {"daily_limit": 50, "action": "Target reached"},
    11: {"daily_limit": 50, "action": "Maintain"},
    12: {"daily_limit": 50, "action": "Maintain"},
    13: {"daily_limit": 50, "action": "Maintain"},
    14: {"daily_limit": 50, "action": "Warm-up complete"},
}
