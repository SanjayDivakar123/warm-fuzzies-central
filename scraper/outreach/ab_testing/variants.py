"""A/B testing variants management."""

import random
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from outreach.database.models import ABTestVariant
from outreach.database import get_db_session


@dataclass
class VariantPerformance:
    """Performance metrics for a variant."""
    variant_id: str
    name: str
    sent_count: int
    open_count: int
    click_count: int
    reply_count: int
    positive_reply_count: int
    
    @property
    def open_rate(self) -> float:
        return (self.open_count / self.sent_count * 100) if self.sent_count > 0 else 0
    
    @property
    def click_rate(self) -> float:
        return (self.click_count / self.sent_count * 100) if self.sent_count > 0 else 0
    
    @property
    def reply_rate(self) -> float:
        return (self.reply_count / self.sent_count * 100) if self.sent_count > 0 else 0
    
    @property
    def positive_reply_rate(self) -> float:
        return (self.positive_reply_count / self.sent_count * 100) if self.sent_count > 0 else 0


class ABTestManager:
    """Manages A/B testing for email variants."""
    
    def __init__(self, min_samples: int = 100):
        self.min_samples = min_samples
    
    async def create_variant(
        self,
        variant_id: str,
        test_type: str,  # "subject", "body", "cta"
        name: str,
        content: str
    ) -> ABTestVariant:
        """Create a new A/B test variant."""
        async with get_db_session() as session:
            variant = ABTestVariant(
                variant_id=variant_id,
                test_type=test_type,
                name=name,
                content=content
            )
            session.add(variant)
            await session.flush()
            return variant
    
    async def get_variant_for_test(
        self,
        test_type: str
    ) -> Optional[ABTestVariant]:
        """Get a variant for testing using weighted random selection."""
        async with get_db_session() as session:
            result = await session.execute(
                select(ABTestVariant)
                .where(
                    ABTestVariant.test_type == test_type,
                    ABTestVariant.is_active == True
                )
            )
            variants = result.scalars().all()
        
        if not variants:
            return None
        
        # If we have a clear winner, use it more often
        winners = [v for v in variants if v.is_winner]
        if winners:
            # 70% chance to use winner, 30% to continue testing
            if random.random() < 0.7:
                return random.choice(winners)
        
        # Random selection for testing
        return random.choice(variants)
    
    async def record_send(self, variant_id: str):
        """Record an email sent with a variant."""
        async with get_db_session() as session:
            await session.execute(
                update(ABTestVariant)
                .where(ABTestVariant.variant_id == variant_id)
                .values(sent_count=ABTestVariant.sent_count + 1)
            )
    
    async def record_open(self, variant_id: str):
        """Record an email open."""
        async with get_db_session() as session:
            await session.execute(
                update(ABTestVariant)
                .where(ABTestVariant.variant_id == variant_id)
                .values(open_count=ABTestVariant.open_count + 1)
            )
    
    async def record_reply(self, variant_id: str, is_positive: bool = False):
        """Record a reply."""
        async with get_db_session() as session:
            variant = await session.execute(
                select(ABTestVariant).where(ABTestVariant.variant_id == variant_id)
            )
            variant = variant.scalar_one_or_none()
            
            if variant:
                variant.reply_count += 1
                if is_positive:
                    variant.positive_reply_count += 1
    
    async def analyze_results(self, test_type: str) -> List[VariantPerformance]:
        """Analyze performance of all variants for a test type."""
        async with get_db_session() as session:
            result = await session.execute(
                select(ABTestVariant)
                .where(ABTestVariant.test_type == test_type)
            )
            variants = result.scalars().all()
        
        performances = []
        for v in variants:
            perf = VariantPerformance(
                variant_id=v.variant_id,
                name=v.name,
                sent_count=v.sent_count,
                open_count=v.open_count,
                click_count=v.click_count,
                reply_count=v.reply_count,
                positive_reply_count=v.positive_reply_count
            )
            performances.append(perf)
        
        return sorted(performances, key=lambda x: x.positive_reply_rate, reverse=True)
    
    async def determine_winner(self, test_type: str) -> Optional[str]:
        """Determine if there's a statistically significant winner."""
        performances = await self.analyze_results(test_type)
        
        if len(performances) < 2:
            return None
        
        # Check if we have enough samples
        for perf in performances:
            if perf.sent_count < self.min_samples:
                return None  # Not enough data yet
        
        # Simple winner determination - highest positive reply rate
        # In production, use proper statistical significance testing
        winner = performances[0]
        runner_up = performances[1]
        
        # Winner must be at least 20% better
        if winner.positive_reply_rate > runner_up.positive_reply_rate * 1.2:
            # Mark winner in database
            async with get_db_session() as session:
                # Clear previous winners
                await session.execute(
                    update(ABTestVariant)
                    .where(ABTestVariant.test_type == test_type)
                    .values(is_winner=False)
                )
                
                # Set new winner
                await session.execute(
                    update(ABTestVariant)
                    .where(ABTestVariant.variant_id == winner.variant_id)
                    .values(is_winner=True)
                )
            
            return winner.variant_id
        
        return None
    
    async def get_test_summary(self) -> Dict[str, Any]:
        """Get summary of all A/B tests."""
        async with get_db_session() as session:
            result = await session.execute(
                select(ABTestVariant.test_type, func.count(ABTestVariant.id))
                .group_by(ABTestVariant.test_type)
            )
            test_counts = dict(result.all())
            
            summaries = {}
            for test_type in test_counts.keys():
                performances = await self.analyze_results(test_type)
                winner = await self.determine_winner(test_type)
                
                summaries[test_type] = {
                    "variant_count": len(performances),
                    "total_sent": sum(p.sent_count for p in performances),
                    "performances": [
                        {
                            "variant_id": p.variant_id,
                            "name": p.name,
                            "sent": p.sent_count,
                            "open_rate": round(p.open_rate, 2),
                            "reply_rate": round(p.reply_rate, 2),
                            "positive_reply_rate": round(p.positive_reply_rate, 2),
                            "is_winner": p.variant_id == winner
                        }
                        for p in performances
                    ]
                }
            
            return summaries


# Pre-defined A/B test variants
DEFAULT_SUBJECT_VARIANTS = [
    {
        "variant_id": "sub_001",
        "name": "Quick Question",
        "content": "Quick question about {{ business_name }}"
    },
    {
        "variant_id": "sub_002",
        "name": "Idea for {{ business_name }}",
        "content": "Idea for {{ business_name }}"
    },
    {
        "variant_id": "sub_003",
        "name": "{{ category }} growth question",
        "content": "Quick question about your {{ category }}"
    },
    {
        "variant_id": "sub_004",
        "name": "5 minutes?",
        "content": "Do you have 5 minutes this week?"
    },
    {
        "variant_id": "sub_005",
        "name": "{{ city }} {{ category }}",
        "content": "Your {{ category }} in {{ city }}"
    }
]

DEFAULT_BODY_VARIANTS = [
    {
        "variant_id": "body_001",
        "name": "Problem-First Short",
        "content": """Hi {{ first_name }},

Noticed {{ business_name }} while researching {{ category }} businesses in {{ city }}.

Are you struggling to get consistent leads without spending on ads?

We help {{ category }} owners add 10-15 new customers/month organically.

Worth a 5-minute chat?

Connor"""
    },
    {
        "variant_id": "body_002",
        "name": "Social Proof Focus",
        "content": """Hi {{ first_name }},

Saw {{ business_name }} and wanted to reach out.

Just helped a {{ category }} in {{ city }} book 12 new appointments last month.

Wondering if you'd be open to hearing how we did it?

No pitch, just sharing what worked.

Connor"""
    },
    {
        "variant_id": "body_003",
        "name": "Direct Value",
        "content": """Hi {{ first_name }},

Quick one: I have a system that gets {{ category }} businesses 3-5 qualified calls per week without ads.

Wanted to see if {{ business_name }} might be a fit.

Interested in seeing how it works?

Connor"""
    }
]


async def initialize_default_variants():
    """Initialize default A/B test variants."""
    manager = ABTestManager()
    
    for variant_data in DEFAULT_SUBJECT_VARIANTS:
        try:
            await manager.create_variant(
                variant_id=variant_data["variant_id"],
                test_type="subject",
                name=variant_data["name"],
                content=variant_data["content"]
            )
        except Exception as e:
            print(f"Error creating subject variant {variant_data['variant_id']}: {e}")
    
    for variant_data in DEFAULT_BODY_VARIANTS:
        try:
            await manager.create_variant(
                variant_id=variant_data["variant_id"],
                test_type="body",
                name=variant_data["name"],
                content=variant_data["content"]
            )
        except Exception as e:
            print(f"Error creating body variant {variant_data['variant_id']}: {e}")
    
    print("Default A/B test variants initialized")
