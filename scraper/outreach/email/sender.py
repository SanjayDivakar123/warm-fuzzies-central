"""Email sending module with async support."""

import asyncio
import uuid
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any, List

import aiosmtplib
from jinja2 import Template

from outreach.database.models import EmailAccount, EmailSent, Business, Sequence
from outreach.database import get_db_session
from outreach.config import settings


class EmailSender:
    """Async email sender."""
    
    def __init__(self):
        self.sent_count = 0
    
    async def send_email(
        self,
        account: EmailAccount,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        reply_to: Optional[str] = None,
        is_warmup: bool = False,
        track_opens: bool = True,
        track_clicks: bool = True
    ) -> Dict[str, Any]:
        """Send an email using the specified account."""
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{account.display_name or settings.default_from_name} <{account.email}>"
        msg["To"] = to_email
        msg["Message-ID"] = f"<{uuid.uuid4()}@{account.email.split('@')[1]}>"
        
        if reply_to or settings.reply_to_email:
            msg["Reply-To"] = reply_to or settings.reply_to_email
        
        # Add text part
        msg.attach(MIMEText(body, "plain", "utf-8"))
        
        # Add HTML part if provided
        if html_body:
            msg.attach(MIMEText(html_body, "html", "utf-8"))
        
        # Add tracking pixel for opens
        if track_opens and not is_warmup:
            tracking_pixel = self._generate_tracking_pixel(msg["Message-ID"])
            # Would append to HTML body
        
        # Send via SMTP
        try:
            await aiosmtplib.send(
                msg,
                hostname=account.smtp_host,
                port=account.smtp_port,
                username=account.smtp_username,
                password=account.smtp_password,
                use_tls=account.smtp_use_tls,
                timeout=30
            )
            
            self.sent_count += 1
            
            return {
                "success": True,
                "message_id": msg["Message-ID"],
                "sent_at": datetime.utcnow()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_tracking_pixel(self, message_id: str) -> str:
        """Generate tracking pixel HTML."""
        # This would be a URL to your tracking endpoint
        tracking_url = f"https://your-domain.com/track/open/{message_id}"
        return f'<img src="{tracking_url}" width="1" height="1" alt="" />'
    
    async def send_sequence_email(
        self,
        account: EmailAccount,
        business: Business,
        sequence: Sequence,
        step_number: int,
        subject: str,
        body: str,
        variant_id: Optional[str] = None,
        variant_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a sequence email and record it."""
        
        # Determine recipient
        to_email = business.owner_email or business.email
        if not to_email:
            return {"success": False, "error": "No email address for business"}
        
        # Personalize content
        personalized_body = self._personalize_email(body, business)
        personalized_subject = self._personalize_email(subject, business)
        
        # Send email
        result = await self.send_email(
            account=account,
            to_email=to_email,
            subject=personalized_subject,
            body=personalized_body
        )
        
        if result["success"]:
            # Record in database
            async with get_db_session() as session:
                email_sent = EmailSent(
                    business_id=business.id,
                    sequence_id=sequence.id,
                    email_account_id=account.id,
                    step_number=step_number,
                    subject=personalized_subject,
                    body=personalized_body,
                    variant_id=variant_id,
                    variant_type=variant_type,
                    message_id=result["message_id"],
                    sent_at=result["sent_at"]
                )
                session.add(email_sent)
            
            # Update account sent count
            from outreach.email.rotation import EmailRotationSystem
            rotation = EmailRotationSystem()
            await rotation.mark_email_sent(account.id)
        
        return result
    
    def _personalize_email(self, content: str, business: Business) -> str:
        """Personalize email content with business data."""
        variables = {
            "business_name": business.name,
            "owner_name": business.owner_name or "there",
            "city": business.city or "",
            "category": business.category or "business",
            "first_name": self._extract_first_name(business.owner_name) or "there"
        }
        
        template = Template(content)
        return template.render(**variables)
    
    def _extract_first_name(self, full_name: Optional[str]) -> Optional[str]:
        """Extract first name from full name."""
        if not full_name:
            return None
        return full_name.split()[0]


class EmailTemplate:
    """Email template with personalization."""
    
    def __init__(self, subject: str, body: str):
        self.subject = subject
        self.body = body
    
    def render(self, **kwargs) -> Dict[str, str]:
        """Render template with variables."""
        subject_template = Template(self.subject)
        body_template = Template(self.body)
        
        return {
            "subject": subject_template.render(**kwargs),
            "body": body_template.render(**kwargs)
        }


# Best practice templates based on Instantly.ai benchmarks
DEFAULT_TEMPLATES = {
    "step_1": EmailTemplate(
        subject="Quick question about {{ business_name }}",
        body="""Hi {{ first_name }},

I came across {{ business_name }} and noticed you're in the {{ category }} space.

Quick question: Are you currently looking to get more customers from {{ city }}?

We help {{ category }} businesses like yours add 10-15 new clients per month without spending on ads.

Worth a brief conversation?

Best,
Connor

---
If you don't want to hear from me, just reply "unsubscribe" and I'll remove you immediately.
"""
    ),
    "step_2": EmailTemplate(
        subject="Re: Quick question about {{ business_name }}",
        body="""Hi {{ first_name }},

Following up on my note from a few days ago about {{ business_name }}.

I know you're busy, so I'll keep this short.

We recently helped a {{ category }} in {{ city }} add 12 new clients in 30 days using our system.

Worth 5 minutes to see if we can do the same for you?

Best,
Connor
"""
    ),
    "step_3": EmailTemplate(
        subject="Should I close your file?",
        body="""Hi {{ first_name }},

I've reached out a couple times about helping {{ business_name }} get more customers.

Haven't heard back, so I'm guessing now isn't the right time or you're all set.

Totally understand either way.

Should I close your file or is there still interest in exploring this?

Best,
Connor
"""
    ),
    "step_4": EmailTemplate(
        subject="One last thing",
        body="""Hi {{ first_name }},

This is my last email about helping {{ business_name }} with customer acquisition.

I don't want to be that guy who keeps emailing when you're not interested.

If you ever want to chat about growing {{ business_name }}, just reply and I'll send over some times.

Otherwise, all the best with the business.

Connor
"""
    ),
    "step_5": EmailTemplate(
        subject="Breakup email",
        body="""Hi {{ first_name }},

I'm officially giving up on trying to reach you about {{ business_name }}.

No hard feelings - I know you're busy running a {{ category }}.

If things change and you want to explore getting more customers, feel free to reach out.

Good luck with everything.

Connor

P.S. - If you want me to stop emailing entirely, just reply "unsubscribe"
"""
    )
}
