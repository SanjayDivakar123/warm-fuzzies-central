"""Common database queries."""

from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import select, update, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from outreach.database.models import (
        Business, EmailAccount, Sequence, EmailSent, WebsiteAudit,
        LeadStatus, SequenceStatus, EmailAccountStatus
    )
except ImportError:
    from database.models import (
        Business, EmailAccount, Sequence, EmailSent, WebsiteAudit,
        LeadStatus, SequenceStatus, EmailAccountStatus
    )


class BusinessQueries:
    """Queries for Business model."""
    
    @staticmethod
    async def get_by_id(session: AsyncSession, business_id: int) -> Optional[Business]:
        result = await session.execute(
            select(Business).where(Business.id == business_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_by_gmb_id(session: AsyncSession, gmb_id: str) -> Optional[Business]:
        result = await session.execute(
            select(Business).where(Business.gmb_id == gmb_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_ready_for_outreach(
        session: AsyncSession, 
        limit: int = 100
    ) -> List[Business]:
        """Get businesses ready for outreach (enriched, not contacted)."""
        result = await session.execute(
            select(Business)
            .where(
                and_(
                    Business.status == LeadStatus.READY,
                    Business.owner_email.isnot(None)
                )
            )
            .limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_for_cold_calling(
        session: AsyncSession,
        min_emails_sent: int = 2,
        limit: int = 500
    ) -> List[Business]:
        """Get businesses that received emails but haven't responded - for cold calling."""
        # Subquery to count emails sent per business
        email_count = (
            select(EmailSent.business_id, func.count(EmailSent.id).label("email_count"))
            .group_by(EmailSent.business_id)
            .subquery()
        )
        
        result = await session.execute(
            select(Business)
            .join(email_count, Business.id == email_count.c.business_id)
            .where(
                and_(
                    Business.status.in_([LeadStatus.CONTACTED, LeadStatus.RESPONDED]),
                    Business.phone.isnot(None),
                    email_count.c.email_count >= min_emails_sent,
                    Business.sequences.any(
                        Sequence.status.in_([
                            SequenceStatus.ACTIVE, 
                            SequenceStatus.COMPLETED,
                            SequenceStatus.REPLIED
                        ])
                    )
                )
            )
            .limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def update_status(
        session: AsyncSession,
        business_id: int,
        status: LeadStatus
    ):
        await session.execute(
            update(Business)
            .where(Business.id == business_id)
            .values(status=status, updated_at=datetime.utcnow())
        )


class EmailAccountQueries:
    """Queries for EmailAccount model."""
    
    @staticmethod
    async def get_active_accounts(
        session: AsyncSession,
        status: EmailAccountStatus = EmailAccountStatus.ACTIVE
    ) -> List[EmailAccount]:
        """Get email accounts ready for sending."""
        result = await session.execute(
            select(EmailAccount)
            .where(
                and_(
                    EmailAccount.status == status,
                    EmailAccount.daily_limit > EmailAccount.emails_sent_today
                )
            )
            .order_by(EmailAccount.emails_sent_today.asc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_warming_accounts(session: AsyncSession) -> List[EmailAccount]:
        """Get accounts in warm-up phase."""
        result = await session.execute(
            select(EmailAccount)
            .where(EmailAccount.status == EmailAccountStatus.WARMING)
        )
        return result.scalars().all()
    
    @staticmethod
    async def increment_sent_count(
        session: AsyncSession,
        account_id: int
    ):
        """Increment sent count for an account."""
        await session.execute(
            update(EmailAccount)
            .where(EmailAccount.id == account_id)
            .values(
                emails_sent_today=EmailAccount.emails_sent_today + 1,
                emails_sent_total=EmailAccount.emails_sent_total + 1,
                last_sent_at=datetime.utcnow()
            )
        )
    
    @staticmethod
    async def reset_daily_counts(session: AsyncSession):
        """Reset daily sent counts (run at midnight)."""
        await session.execute(
            update(EmailAccount)
            .values(emails_sent_today=0)
        )


class SequenceQueries:
    """Queries for Sequence model."""
    
    @staticmethod
    async def get_pending_sequences(
        session: AsyncSession,
        limit: int = 100
    ) -> List[Sequence]:
        """Get sequences ready for next email."""
        now = datetime.utcnow()
        result = await session.execute(
            select(Sequence)
            .where(
                and_(
                    Sequence.status == SequenceStatus.ACTIVE,
                    or_(
                        Sequence.next_send_at.is_(None),
                        Sequence.next_send_at <= now
                    )
                )
            )
            .limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def pause_sequence(
        session: AsyncSession,
        sequence_id: int,
        reason: str = "manual"
    ):
        """Pause a sequence."""
        await session.execute(
            update(Sequence)
            .where(Sequence.id == sequence_id)
            .values(
                status=SequenceStatus.PAUSED,
                updated_at=datetime.utcnow()
            )
        )
    
    @staticmethod
    async def mark_replied(
        session: AsyncSession,
        sequence_id: int
    ):
        """Mark sequence as replied."""
        await session.execute(
            update(Sequence)
            .where(Sequence.id == sequence_id)
            .values(
                status=SequenceStatus.REPLIED,
                completed_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        )


class EmailSentQueries:
    """Queries for EmailSent model."""
    
    @staticmethod
    async def get_by_message_id(
        session: AsyncSession,
        message_id: str
    ) -> Optional[EmailSent]:
        result = await session.execute(
            select(EmailSent).where(EmailSent.message_id == message_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_by_business_and_step(
        session: AsyncSession,
        business_id: int,
        step: int
    ) -> Optional[EmailSent]:
        result = await session.execute(
            select(EmailSent)
            .where(
                and_(
                    EmailSent.business_id == business_id,
                    EmailSent.step_number == step
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def mark_replied(
        session: AsyncSession,
        email_id: int,
        reply_content: str,
        is_positive: bool = False
    ):
        await session.execute(
            update(EmailSent)
            .where(EmailSent.id == email_id)
            .values(
                replied_at=datetime.utcnow(),
                reply_content=reply_content,
                is_positive_reply=is_positive
            )
        )
    
    @staticmethod
    async def mark_bounced(
        session: AsyncSession,
        email_id: int
    ):
        await session.execute(
            update(EmailSent)
            .where(EmailSent.id == email_id)
            .values(bounced_at=datetime.utcnow())
        )


class WebsiteAuditQueries:
    """Queries for WebsiteAudit model."""
    
    @staticmethod
    async def get_by_business_id(
        session: AsyncSession,
        business_id: int
    ) -> Optional[WebsiteAudit]:
        """Get audit for a specific business."""
        result = await session.execute(
            select(WebsiteAudit).where(WebsiteAudit.business_id == business_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        audit_id: int
    ) -> Optional[WebsiteAudit]:
        """Get audit by ID."""
        result = await session.execute(
            select(WebsiteAudit).where(WebsiteAudit.id == audit_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_businesses_without_audit(
        session: AsyncSession,
        limit: int = 100
    ) -> List[Business]:
        """Get businesses that have websites but no audit yet."""
        from sqlalchemy import not_, exists
        
        result = await session.execute(
            select(Business)
            .where(
                and_(
                    Business.website.isnot(None),
                    Business.website != '',
                    ~exists().where(WebsiteAudit.business_id == Business.id)
                )
            )
            .limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_businesses_with_issues(
        session: AsyncSession,
        min_severity: str = "major",
        limit: int = 100
    ) -> List[Business]:
        """Get businesses whose websites have specific severity issues."""
        severity_order = {"critical": 3, "major": 2, "minor": 1}
        min_level = severity_order.get(min_severity, 2)
        
        result = await session.execute(
            select(Business)
            .join(WebsiteAudit, Business.id == WebsiteAudit.business_id)
            .where(WebsiteAudit.issues.isnot(None))
            .limit(limit)
        )
        
        businesses = result.scalars().all()
        
        # Filter by severity (need to check JSON data)
        filtered = []
        for business in businesses:
            if business.website_audit and business.website_audit.issues:
                for issue in business.website_audit.issues:
                    if severity_order.get(issue.get('severity', ''), 0) >= min_level:
                        filtered.append(business)
                        break
        
        return filtered[:limit]
