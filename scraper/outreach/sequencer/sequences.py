"""Outreach sequence definitions and management."""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from outreach.database.models import Sequence, SequenceStatus, Business, LeadStatus, EmailSent
    from outreach.database import get_db_session
    from outreach.config import settings
except ImportError:
    from database.models import Sequence, SequenceStatus, Business, LeadStatus, EmailSent
    from database import get_db_session
    from config import settings


@dataclass
class SequenceStep:
    """Defines a step in an outreach sequence."""
    step_number: int
    delay_days: int
    subject_template: str
    body_template: str
    variant_id: Optional[str] = None


class OutreachSequence:
    """Manages outreach sequences."""
    
    # Website redesign sequence - hyper personalized with audit findings
    DEFAULT_STEPS = [
        SequenceStep(
            step_number=1,
            delay_days=0,
            subject_template="{{ business_name }}'s website",
            body_template="""Hi {{ first_name }},

I was looking at {{ business_name }}'s website and noticed a few things that might be costing you customers:

{% if primary_issue %}{{ primary_issue }}{% else %}Your website looks outdated compared to your competitors.{% endif %}

{% if is_not_mobile %}Over 60% of potential customers browse on mobile devices. When your site doesn't work on phones, they simply call someone else.{% endif %}

{% if no_ssl %}Your site shows "Not Secure" in browsers, which makes visitors worry about their data.{% endif %}

{% if is_slow %}Your site takes {{ load_time }} seconds to load. 40% of visitors leave after 3 seconds.{% endif %}

We build modern websites specifically for {{ category }} businesses that load fast, work on all devices, and actually convert visitors into calls.

If you don't like what we create, you don't pay.

Worth seeing what your new site could look like?

Connor

---
Reply "unsubscribe" to stop
"""
        ),
        SequenceStep(
            step_number=2,
            delay_days=3,
            subject_template="Re: {{ business_name }}'s website",
            body_template="""Hi {{ first_name }},

Quick follow-up on my note about {{ business_name }}'s website.

{% if no_contact_form %}I noticed you don't have a contact form. Many customers prefer filling out a quick form at night rather than calling during business hours. You're missing those leads.{% endif %}

{% if no_cta %}Your site also lacks a clear "Call Now" or "Book Service" button. Visitors need to be told exactly what to do next.{% endif %}

{% if has_broken_links %}I also found {{ broken_link_count }} broken links on your site. This hurts your Google ranking and makes your business look unprofessional.{% endif %}

Most {{ category }} businesses in {{ city }} lose 20-30% of potential clients because of these exact issues.

We just redesigned a {{ category }} site last week. The owner said it was the best website they've ever seen - and he's getting 3x more quote requests.

Want to see what we could do for {{ business_name }}? Still no risk - if you don't love it, no charge.

Connor
"""
        ),
        SequenceStep(
            step_number=3,
            delay_days=7,
            subject_template="{{ business_name }} - should I close the file?",
            body_template="""Hi {{ first_name }},

I've reached out twice about {{ business_name }}'s website.

No pressure - I know you're busy running the business.

But I want to be direct: {% if primary_issue %}{{ primary_issue }}{% else %}your current website isn't doing you any favors{% endif %}. Every day it stays as-is, you're losing potential customers to competitors with better sites.

If fixing this isn't a priority right now, totally understand. Should I close your file?

Or if you want to see what a modern, lead-generating site would look like for {{ business_name }}, just reply and I'll send examples.

Connor
"""
        ),
        SequenceStep(
            step_number=4,
            delay_days=7,
            subject_template="One last thing about {{ business_name }}'s site",
            body_template="""Hi {{ first_name }},

This is my last email about {{ business_name }}'s website.

I don't want to keep reaching out if you're not interested.

Just remember: {% if is_not_mobile %}most of your competitors' sites work perfectly on phones now.{% elif is_slow %}your competitors' sites load in under 2 seconds.{% elif no_ssl %}your competitors' sites show "Secure" to visitors.{% else %}your website is often the first impression potential customers get.{% endif %}

If you ever want to see what a professional site would look like for {{ business_name }}, just reply.

Otherwise, best of luck with the business.

Connor
"""
        ),
        SequenceStep(
            step_number=5,
            delay_days=7,
            subject_template="Giving up on {{ business_name }}",
            body_template="""Hi {{ first_name }},

I'm officially giving up on trying to reach you about {{ business_name }}'s website.

No hard feelings - I know you're busy.

If you ever want a risk-free website redesign (love it or don't pay), feel free to reach out.

Good luck with everything.

Connor

P.S. - Reply "unsubscribe" to stop emails
"""
        )
    ]
    
    # Alternative sequence focused on specific audit findings (more aggressive)
    AUDIT_FOCUSED_STEPS = [
        SequenceStep(
            step_number=1,
            delay_days=0,
            subject_template="{{ business_name }} - website issue",
            body_template="""Hi {{ first_name }},

I was reviewing {{ category }} businesses in {{ city }} and found a significant issue with {{ business_name }}'s website:

{% if primary_issue %}{{ primary_issue }}

{% endif %}{% if is_not_mobile %}This is critical because 60%+ of your potential customers browse on mobile devices. When your site doesn't display properly, they leave within seconds.

{% endif %}{% if no_ssl %}The "Not Secure" warning in browsers is scaring away potential customers who worry about their personal information.

{% endif %}{% if is_slow %}A {{ load_time }} second load time means you're losing about 40% of visitors before they even see your services.

{% endif %}{% if no_contact_form %}Without a contact form, you're missing leads from people who prefer to reach out online rather than call.

{% endif %}I specialize in fixing these exact issues for {{ category }} businesses. Fast, mobile-friendly, secure websites that actually generate leads.

Want me to send you a quick video showing what's wrong and how we'd fix it? No cost, no obligation.

Connor

---
Reply "unsubscribe" to stop
"""
        ),
        SequenceStep(
            step_number=2,
            delay_days=3,
            subject_template="{{ business_name }} - losing customers?",
            body_template="""Hi {{ first_name }},

Following up on the website issues I found with {{ business_name }}.

{% if secondary_issue %}{{ secondary_issue }}

{% endif %}Your competitors are capturing the customers who bounce off your site. Every day this continues costs you money.

We just helped another {{ category }} in {{ city }} fix similar issues. They're now getting 3x more quote requests from the same ad spend.

I can show you exactly what's broken and how we'd fix it - 5 minute video, no pitch.

Interested?

Connor
"""
        ),
        SequenceStep(
            step_number=3,
            delay_days=5,
            subject_template="{{ business_name }} - last follow up",
            body_template="""Hi {{ first_name }},

Last email about {{ business_name }}'s website.

The issues I found ({% if issue_count %}{{ issue_count }}{% else %}several{% endif %} of them) are costing you customers every day.

I get it - you're busy running the business. But this is a 10-minute fix that could bring in thousands in new revenue.

Want the free video audit showing exactly what's wrong? Just reply "yes."

Otherwise, I'll assume you're all set and stop reaching out.

Connor
"""
        ),
    ]
    
    def __init__(self, steps: Optional[List[SequenceStep]] = None):
        self.steps = steps or self.DEFAULT_STEPS
    
    async def create_sequence(
        self,
        business_id: int,
        name: str = "Default Outreach"
    ) -> Optional[Sequence]:
        """Create a new sequence for a business."""
        async with get_db_session() as session:
            # Check if business exists and is ready
            business = await session.get(Business, business_id)
            if not business:
                return None
            
            if business.status != LeadStatus.READY:
                return None
            
            # Check if sequence already exists
            result = await session.execute(
                select(Sequence).where(
                    and_(
                        Sequence.business_id == business_id,
                        Sequence.status.in_([
                            SequenceStatus.PENDING,
                            SequenceStatus.ACTIVE
                        ])
                    )
                )
            )
            if result.scalar_one_or_none():
                return None  # Already has active sequence
            
            # Create sequence
            sequence = Sequence(
                business_id=business_id,
                name=name,
                step_count=len(self.steps),
                status=SequenceStatus.PENDING,
                current_step=0,
                next_send_at=datetime.utcnow()  # Ready to start
            )
            session.add(sequence)
            await session.flush()
            
            # Update business status
            business.status = LeadStatus.CONTACTED
            
            return sequence
    
    async def start_sequence(self, sequence_id: int) -> bool:
        """Start a pending sequence."""
        async with get_db_session() as session:
            sequence = await session.get(Sequence, sequence_id)
            if not sequence or sequence.status != SequenceStatus.PENDING:
                return False
            
            sequence.status = SequenceStatus.ACTIVE
            sequence.started_at = datetime.utcnow()
            sequence.current_step = 1
            
            # Set next send time (first email goes immediately)
            sequence.next_send_at = datetime.utcnow()
            
            return True
    
    async def get_next_step(
        self,
        sequence_id: int
    ) -> Optional[SequenceStep]:
        """Get the next step for a sequence."""
        async with get_db_session() as session:
            sequence = await session.get(Sequence, sequence_id)
            if not sequence:
                return None
            
            next_step_num = sequence.current_step + 1
            
            # Check if sequence is complete
            if next_step_num > len(self.steps):
                return None
            
            # Find step definition
            for step in self.steps:
                if step.step_number == next_step_num:
                    return step
            
            return None
    
    async def advance_sequence(
        self,
        sequence_id: int,
        step: SequenceStep
    ) -> bool:
        """Advance sequence to next step."""
        async with get_db_session() as session:
            sequence = await session.get(Sequence, sequence_id)
            if not sequence:
                return False
            
            sequence.current_step = step.step_number
            
            # Calculate next send time
            sequence.next_send_at = datetime.utcnow() + timedelta(days=step.delay_days)
            
            # Check if sequence is complete
            if step.step_number >= sequence.step_count:
                sequence.status = SequenceStatus.COMPLETED
                sequence.completed_at = datetime.utcnow()
            
            return True
    
    async def pause_sequence(self, sequence_id: int, reason: str = "") -> bool:
        """Pause an active sequence."""
        async with get_db_session() as session:
            sequence = await session.get(Sequence, sequence_id)
            if not sequence or sequence.status != SequenceStatus.ACTIVE:
                return False
            
            sequence.status = SequenceStatus.PAUSED
            return True
    
    async def resume_sequence(self, sequence_id: int) -> bool:
        """Resume a paused sequence."""
        async with get_db_session() as session:
            sequence = await session.get(Sequence, sequence_id)
            if not sequence or sequence.status != SequenceStatus.PAUSED:
                return False
            
            sequence.status = SequenceStatus.ACTIVE
            return True
    
    def personalize_step(
        self,
        step: SequenceStep,
        business: Business,
        website_audit: Optional[Any] = None
    ) -> Dict[str, str]:
        """Personalize a step for a business with optional website audit data."""
        from jinja2 import Template
        
        variables = {
            "business_name": business.name,
            "owner_name": business.owner_name or "there",
            "first_name": self._extract_first_name(business.owner_name) or "there",
            "city": business.city or "your area",
            "category": business.category or "business"
        }
        
        # Add website audit data if available
        if website_audit:
            variables["has_website_issues"] = len(website_audit.issues) > 0
            variables["issue_count"] = len(website_audit.issues)
            variables["is_slow"] = website_audit.load_time_ms and website_audit.load_time_ms > 3000
            variables["load_time"] = f"{website_audit.load_time_ms/1000:.1f}" if website_audit.load_time_ms else "unknown"
            variables["is_not_mobile"] = not website_audit.is_mobile_friendly
            variables["no_ssl"] = not website_audit.has_ssl
            variables["no_contact_form"] = not website_audit.has_contact_form
            variables["no_cta"] = not website_audit.has_clear_cta
            variables["has_broken_links"] = website_audit.broken_links > 0
            variables["broken_link_count"] = website_audit.broken_links
            variables["is_outdated"] = website_audit.uses_tables_for_layout or website_audit.has_deprecated_tags
            
            # Primary talking point (most compelling issue)
            if website_audit.talking_points:
                variables["primary_issue"] = website_audit.talking_points[0]
                variables["secondary_issue"] = website_audit.talking_points[1] if len(website_audit.talking_points) > 1 else None
            else:
                variables["primary_issue"] = None
                variables["secondary_issue"] = None
        
        subject_template = Template(step.subject_template)
        body_template = Template(step.body_template)
        
        return {
            "subject": subject_template.render(**variables),
            "body": body_template.render(**variables),
            "step_number": step.step_number
        }
    
    def _extract_first_name(self, full_name: Optional[str]) -> Optional[str]:
        """Extract first name from full name."""
        if not full_name:
            return None
        return full_name.split()[0]


class SequenceManager:
    """Manages multiple sequences."""
    
    def __init__(self, use_audit_focused: bool = False):
        if use_audit_focused:
            self.sequence_template = OutreachSequence(steps=OutreachSequence.AUDIT_FOCUSED_STEPS)
        else:
            self.sequence_template = OutreachSequence()
    
    async def create_sequence(
        self,
        business_id: int,
        name: str = "Default Outreach",
        use_audit_data: bool = True
    ) -> Optional[Sequence]:
        """Create a new sequence for a business with optional audit data."""
        from outreach.database.queries import WebsiteAuditQueries
        
        async with get_db_session() as session:
            # Check if business exists and is ready
            from outreach.database.models import Business
            business = await session.get(Business, business_id)
            if not business:
                return None
            
            if business.status != LeadStatus.READY:
                return None
            
            # Check if sequence already exists
            from sqlalchemy import select, and_
            result = await session.execute(
                select(Sequence).where(
                    and_(
                        Sequence.business_id == business_id,
                        Sequence.status.in_([
                            SequenceStatus.PENDING,
                            SequenceStatus.ACTIVE
                        ])
                    )
                )
            )
            if result.scalar_one_or_none():
                return None  # Already has active sequence
            
            # Get website audit if available
            website_audit = None
            if use_audit_data:
                website_audit = await WebsiteAuditQueries.get_by_business_id(session, business_id)
            
            # Create sequence
            sequence = Sequence(
                business_id=business_id,
                name=name,
                step_count=len(self.sequence_template.steps),
                status=SequenceStatus.PENDING,
                current_step=0,
                next_send_at=datetime.utcnow()  # Ready to start
            )
            session.add(sequence)
            await session.flush()
            
            # Store audit reference for later personalization
            if website_audit:
                sequence.audit_id = website_audit.id
            
            # Update business status
            business.status = LeadStatus.CONTACTED
            
            return sequence
    
    async def create_sequences_for_batch(
        self,
        business_ids: List[int],
        batch_size: int = 100,
        use_audit_data: bool = True
    ) -> Dict[str, int]:
        """Create sequences for multiple businesses with audit data."""
        created = 0
        skipped = 0
        failed = 0
        
        for business_id in business_ids:
            try:
                sequence = await self.create_sequence(
                    business_id, 
                    use_audit_data=use_audit_data
                )
                if sequence:
                    created += 1
                else:
                    skipped += 1
            except Exception as e:
                print(f"Error creating sequence for {business_id}: {e}")
                failed += 1
        
        return {
            "created": created,
            "skipped": skipped,
            "failed": failed
        }
    
    async def get_active_sequences(
        self,
        limit: int = 100
    ) -> List[Sequence]:
        """Get sequences ready for next email."""
        from outreach.database.queries import SequenceQueries
        
        async with get_db_session() as session:
            return await SequenceQueries.get_pending_sequences(session, limit)
    
    async def get_sequence_stats(self) -> Dict[str, Any]:
        """Get statistics on sequences."""
        from sqlalchemy import func
        
        async with get_db_session() as session:
            # Count by status
            result = await session.execute(
                select(Sequence.status, func.count(Sequence.id))
                .group_by(Sequence.status)
            )
            status_counts = dict(result.all())
            
            # Total sequences
            total_result = await session.execute(
                select(func.count(Sequence.id))
            )
            total = total_result.scalar()
            
            # Replied sequences
            replied_result = await session.execute(
                select(func.count(Sequence.id))
                .where(Sequence.status == SequenceStatus.REPLIED)
            )
            replied = replied_result.scalar()
            
            return {
                "total": total,
                "by_status": status_counts,
                "replied": replied,
                "reply_rate": (replied / total * 100) if total > 0 else 0
            }
