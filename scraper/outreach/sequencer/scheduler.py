"""Sequence scheduler for automated sending."""

import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional

from outreach.database.models import Sequence, SequenceStatus, Business, EmailAccount
from outreach.database import get_db_session
from outreach.database.queries import SequenceQueries, EmailAccountQueries
from outreach.sequencer.sequences import OutreachSequence, SequenceStep
from outreach.email.sender import EmailSender
from outreach.email.rotation import EmailRotationSystem
from outreach.ab_testing.variants import ABTestManager


class SequenceScheduler:
    """Schedules and sends sequence emails."""
    
    def __init__(self):
        self.sequence_template = OutreachSequence()
        self.rotation = EmailRotationSystem()
        self.sender = EmailSender()
        self.ab_manager = ABTestManager()
        self.running = False
    
    async def process_pending_sequences(self, batch_size: int = 50) -> Dict[str, Any]:
        """Process sequences that are ready for next email."""
        stats = {
            "processed": 0,
            "sent": 0,
            "failed": 0,
            "skipped": 0
        }
        
        # Get pending sequences
        async with get_db_session() as session:
            sequences = await SequenceQueries.get_pending_sequences(session, batch_size)
        
        for sequence in sequences:
            try:
                result = await self._process_sequence(sequence)
                stats["processed"] += 1
                
                if result.get("sent"):
                    stats["sent"] += 1
                elif result.get("failed"):
                    stats["failed"] += 1
                else:
                    stats["skipped"] += 1
                    
            except Exception as e:
                print(f"Error processing sequence {sequence.id}: {e}")
                stats["failed"] += 1
        
        return stats
    
    async def _process_sequence(self, sequence: Sequence) -> Dict[str, Any]:
        """Process a single sequence."""
        async with get_db_session() as session:
            # Get business
            business = await session.get(Business, sequence.business_id)
            if not business:
                return {"failed": True, "error": "Business not found"}
            
            # Check if business has email
            to_email = business.owner_email or business.email
            if not to_email:
                sequence.status = SequenceStatus.PAUSED
                return {"skipped": True, "error": "No email address"}
            
            # Get next step
            next_step = await self.sequence_template.get_next_step(sequence.id)
            if not next_step:
                # Sequence complete
                sequence.status = SequenceStatus.COMPLETED
                sequence.completed_at = datetime.utcnow()
                return {"completed": True}
            
            # Get email account
            account = await self.rotation.get_next_account()
            if not account:
                return {"skipped": True, "error": "No available email accounts"}
            
            # Get A/B test variant
            variant = await self.ab_manager.get_variant_for_test("subject")
            
            # Personalize step
            personalized = self.sequence_template.personalize_step(next_step, business)
            
            # Apply variant if available
            if variant:
                if variant.test_type == "subject":
                    personalized["subject"] = variant.content
                elif variant.test_type == "body":
                    personalized["body"] = variant.content
            
            # Send email
            result = await self.sender.send_sequence_email(
                account=account,
                business=business,
                sequence=sequence,
                step_number=next_step.step_number,
                subject=personalized["subject"],
                body=personalized["body"],
                variant_id=variant.variant_id if variant else None,
                variant_type=variant.test_type if variant else None
            )
            
            if result["success"]:
                # Advance sequence
                await self.sequence_template.advance_sequence(sequence.id, next_step)
                
                # Update A/B test stats
                if variant:
                    await self.ab_manager.record_send(variant.variant_id)
                
                return {"sent": True, "message_id": result["message_id"]}
            else:
                return {"failed": True, "error": result.get("error")}
    
    async def run_continuous(self, interval_seconds: int = 60):
        """Run scheduler continuously."""
        self.running = True
        print(f"Sequence scheduler started (checking every {interval_seconds}s)")
        
        while self.running:
            try:
                stats = await self.process_pending_sequences()
                if stats["processed"] > 0:
                    print(f"Scheduler cycle: {stats}")
                
            except Exception as e:
                print(f"Error in scheduler: {e}")
            
            await asyncio.sleep(interval_seconds)
    
    def stop(self):
        """Stop the scheduler."""
        self.running = False
        print("Sequence scheduler stopped")


class DailyScheduler:
    """Manages daily sending limits and scheduling."""
    
    def __init__(self, target_daily_emails: int = 1000):
        self.target_daily = target_daily_emails
        self.scheduler = SequenceScheduler()
    
    async def calculate_send_schedule(self) -> Dict[str, Any]:
        """Calculate optimal send schedule for the day."""
        # Get available capacity
        capacity = await self.scheduler.rotation.get_sending_capacity()
        
        total_capacity = capacity["daily_capacity"]
        target = min(self.target_daily, total_capacity)
        
        # Spread throughout the day (9 AM - 5 PM = 8 hours)
        hours_available = 8
        emails_per_hour = target / hours_available
        
        # Add some randomness (±20%)
        import random
        schedule = []
        for hour in range(9, 17):  # 9 AM to 5 PM
            hour_count = int(emails_per_hour * random.uniform(0.8, 1.2))
            schedule.append({
                "hour": hour,
                "target_emails": hour_count
            })
        
        return {
            "total_target": target,
            "hourly_schedule": schedule,
            "capacity_ratio": capacity["capacity_ratio"]
        }
    
    async def run_hourly_batch(self):
        """Run a batch of sends for the current hour."""
        schedule = await self.calculate_send_schedule()
        
        current_hour = datetime.now().hour
        hour_schedule = next(
            (s for s in schedule["hourly_schedule"] if s["hour"] == current_hour),
            None
        )
        
        if not hour_schedule:
            return {"status": "outside_hours"}
        
        target = hour_schedule["target_emails"]
        
        # Process sequences
        stats = await self.scheduler.process_pending_sequences(batch_size=target)
        
        return {
            "status": "completed",
            "hour": current_hour,
            "target": target,
            "actual": stats["sent"]
        }
