"""Reply detection and processing module."""

import asyncio
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

from imap_tools import MailBox, AND
from sqlalchemy import select, update

from outreach.database.models import EmailSent, Sequence, SequenceStatus, Business, LeadStatus
from outreach.database import get_db_session
from outreach.config import settings


@dataclass
class DetectedReply:
    """Represents a detected reply."""
    original_message_id: str
    reply_email_id: str
    from_email: str
    subject: str
    content: str
    received_at: datetime
    is_unsubscribe: bool
    is_positive: bool
    sentiment_score: float


class ReplyDetector:
    """Detects and processes email replies."""
    
    # Patterns indicating unsubscribe requests
    UNSUBSCRIBE_PATTERNS = [
        r"\bunsubscribe\b",
        r"\bremove me\b",
        r"\bstop emailing\b",
        r"\btake me off\b",
        r"\bopt out\b",
        r"\bdon't contact\b",
        r"\bdo not contact\b",
        r"\bremove from list\b",
    ]
    
    # Patterns indicating positive/interest
    POSITIVE_PATTERNS = [
        r"\binterested\b",
        r"\bwould like to learn more\b",
        r"\btell me more\b",
        r"\bschedule a call\b",
        r"\bbook a meeting\b",
        r"\bsend me the\b",
        r"\bhow much\b",
        r"\bpricing\b",
        r"\bwhat does it cost\b",
        r"\blet's talk\b",
        r"\bcall me\b",
        r"\bmy number\b",
    ]
    
    # Patterns indicating negative
    NEGATIVE_PATTERNS = [
        r"\bnot interested\b",
        r"\bno thanks\b",
        r"\bnot now\b",
        r"\bwe're good\b",
        r"\balready have\b",
        r"\bdon't need\b",
    ]
    
    def __init__(self):
        self.processed_count = 0
    
    def _check_patterns(self, text: str, patterns: List[str]) -> bool:
        """Check if text matches any patterns."""
        text_lower = text.lower()
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return True
        return False
    
    def analyze_sentiment(self, content: str) -> Tuple[bool, float]:
        """Analyze sentiment of reply content."""
        is_positive = self._check_patterns(content, self.POSITIVE_PATTERNS)
        is_negative = self._check_patterns(content, self.NEGATIVE_PATTERNS)
        is_unsubscribe = self._check_patterns(content, self.UNSUBSCRIBE_PATTERNS)
        
        # Calculate sentiment score (-1 to 1)
        score = 0.0
        if is_positive:
            score += 0.5
        if is_negative:
            score -= 0.5
        if is_unsubscribe:
            score -= 1.0
        
        # Clamp to -1 to 1
        score = max(-1, min(1, score))
        
        return is_positive, score
    
    async def check_account_replies(
        self,
        account: Any  # EmailAccount
    ) -> List[DetectedReply]:
        """Check for replies in an email account's inbox."""
        replies = []
        
        if not account.imap_host:
            return replies
        
        try:
            with MailBox(account.imap_host).login(
                account.imap_username or account.email,
                account.imap_password or account.smtp_password
            ) as mailbox:
                # Get emails from last 24 hours
                since_date = datetime.now() - timedelta(days=1)
                
                # Fetch unseen emails
                for msg in mailbox.fetch(AND(seen=False, date_gte=since_date.date())):
                    # Check if this is a reply to one of our emails
                    in_reply_to = msg.headers.get("in-reply-to", [None])[0]
                    references = msg.headers.get("references", [""])[0].split()
                    
                    # Look for original message ID
                    original_id = in_reply_to or (references[0] if references else None)
                    
                    if original_id:
                        is_positive, sentiment = self.analyze_sentiment(msg.text or "")
                        
                        reply = DetectedReply(
                            original_message_id=original_id.strip("<>"),
                            reply_email_id=msg.uid,
                            from_email=msg.from_,
                            subject=msg.subject,
                            content=msg.text or "",
                            received_at=msg.date,
                            is_unsubscribe=self._check_patterns(
                                msg.text or "", self.UNSUBSCRIBE_PATTERNS
                            ),
                            is_positive=is_positive,
                            sentiment_score=sentiment
                        )
                        replies.append(reply)
                        
        except Exception as e:
            print(f"Error checking replies for {account.email}: {e}")
        
        return replies
    
    async def process_reply(self, reply: DetectedReply) -> bool:
        """Process a detected reply."""
        async with get_db_session() as session:
            # Find original email
            result = await session.execute(
                select(EmailSent).where(
                    EmailSent.message_id == reply.original_message_id
                )
            )
            original_email = result.scalar_one_or_none()
            
            if not original_email:
                return False
            
            # Update original email with reply info
            original_email.replied_at = reply.received_at
            original_email.reply_content = reply.content[:2000]  # Limit length
            original_email.is_positive_reply = reply.is_positive
            
            # Get sequence and business
            sequence = None
            if original_email.sequence_id:
                sequence = await session.get(Sequence, original_email.sequence_id)
            
            business = await session.get(Business, original_email.business_id)
            
            # Handle unsubscribe
            if reply.is_unsubscribe:
                if sequence:
                    sequence.status = SequenceStatus.UNSUBSCRIBED
                if business:
                    business.status = LeadStatus.UNSUBSCRIBED
                
                # Add to unsubscribe list
                from outreach.database.models import Unsubscribe
                unsub = Unsubscribe(
                    email=reply.from_email,
                    business_id=business.id if business else None,
                    source="email_reply"
                )
                session.add(unsub)
                
                print(f"Unsubscribe request from {reply.from_email}")
                return True
            
            # Pause sequence on any reply (positive or negative)
            if sequence and sequence.status == SequenceStatus.ACTIVE:
                sequence.status = SequenceStatus.REPLIED
                sequence.completed_at = datetime.utcnow()
            
            # Update business status
            if business:
                if reply.is_positive:
                    business.status = LeadStatus.RESPONDED
                else:
                    business.status = LeadStatus.DECLINED
            
            self.processed_count += 1
            return True
    
    async def check_all_accounts(self) -> Dict[str, Any]:
        """Check for replies across all email accounts."""
        from outreach.database.models import EmailAccount
        
        async with get_db_session() as session:
            result = await session.execute(
                select(EmailAccount).where(
                    EmailAccount.imap_host.isnot(None)
                )
            )
            accounts = result.scalars().all()
        
        total_replies = 0
        processed = 0
        
        for account in accounts:
            try:
                replies = await self.check_account_replies(account)
                total_replies += len(replies)
                
                for reply in replies:
                    success = await self.process_reply(reply)
                    if success:
                        processed += 1
                    
                    await asyncio.sleep(0.1)  # Brief pause
                    
            except Exception as e:
                print(f"Error processing account {account.email}: {e}")
                continue
        
        return {
            "accounts_checked": len(accounts),
            "replies_found": total_replies,
            "replies_processed": processed
        }


class ReplyMonitor:
    """Background monitor for replies."""
    
    def __init__(self, check_interval_minutes: int = 15):
        self.check_interval = check_interval_minutes
        self.detector = ReplyDetector()
        self.running = False
    
    async def start(self):
        """Start the reply monitor."""
        self.running = True
        print(f"Reply monitor started (checking every {self.check_interval} minutes)")
        
        while self.running:
            try:
                result = await self.detector.check_all_accounts()
                print(f"Reply check complete: {result}")
                
            except Exception as e:
                print(f"Error in reply monitor: {e}")
            
            # Wait for next check
            await asyncio.sleep(self.check_interval * 60)
    
    def stop(self):
        """Stop the reply monitor."""
        self.running = False
        print("Reply monitor stopped")


# Auto-responder for common replies
class AutoResponder:
    """Auto-respond to certain types of replies."""
    
    RESPONSES = {
        "unsubscribe": (
            "You've been unsubscribed. You won't receive any more emails from us. "
            "Sorry for any inconvenience."
        ),
        "pricing_request": (
            "Thanks for your interest! I'd be happy to discuss pricing and see if we're a good fit. "
            "When's a good time for a quick 10-minute call this week?"
        ),
        "info_request": (
            "Thanks for reaching out! I've attached some information about our services. "
            "Would you like to schedule a brief call to discuss your specific needs?"
        ),
    }
    
    async def should_auto_respond(self, reply: DetectedReply) -> Optional[str]:
        """Determine if and how to auto-respond."""
        if reply.is_unsubscribe:
            return None  # Don't auto-respond to unsubscribes
        
        content_lower = reply.content.lower()
        
        if "price" in content_lower or "cost" in content_lower or "how much" in content_lower:
            return self.RESPONSES["pricing_request"]
        
        if "more info" in content_lower or "tell me more" in content_lower:
            return self.RESPONSES["info_request"]
        
        return None
