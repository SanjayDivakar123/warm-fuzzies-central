"""A/B test results analyzer."""

import math
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
from datetime import datetime

from scipy import stats


@dataclass
class StatisticalResult:
    """Statistical test result."""
    variant_a: str
    variant_b: str
    metric: str
    improvement_pct: float
    p_value: float
    is_significant: bool
    confidence_level: float
    recommendation: str


class ABTestAnalyzer:
    """Analyzes A/B test results with statistical significance."""
    
    def __init__(self, confidence_level: float = 0.95):
        self.confidence_level = confidence_level
        self.alpha = 1 - confidence_level
    
    def calculate_sample_size(
        self,
        baseline_rate: float,
        minimum_detectable_effect: float,
        power: float = 0.8
    ) -> int:
        """Calculate required sample size for A/B test."""
        # Z-scores for confidence level and power
        z_alpha = stats.norm.ppf(1 - self.alpha / 2)
        z_beta = stats.norm.ppf(power)
        
        # Pooled probability
        p1 = baseline_rate
        p2 = baseline_rate * (1 + minimum_detectable_effect)
        p_avg = (p1 + p2) / 2
        
        # Sample size formula
        n = (
            (z_alpha * math.sqrt(2 * p_avg * (1 - p_avg)) +
             z_beta * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
        ) / (p1 - p2) ** 2
        
        return math.ceil(n)
    
    def two_proportion_z_test(
        self,
        successes_a: int,
        trials_a: int,
        successes_b: int,
        trials_b: int
    ) -> Tuple[float, float]:
        """
        Perform two-proportion z-test.
        Returns (z_score, p_value)
        """
        # Proportions
        p1 = successes_a / trials_a
        p2 = successes_b / trials_b
        
        # Pooled proportion
        p_pool = (successes_a + successes_b) / (trials_a + trials_b)
        
        # Standard error
        se = math.sqrt(p_pool * (1 - p_pool) * (1/trials_a + 1/trials_b))
        
        # Z-score
        z = (p1 - p2) / se
        
        # Two-tailed p-value
        p_value = 2 * (1 - stats.norm.cdf(abs(z)))
        
        return z, p_value
    
    def analyze_variants(
        self,
        variant_a: Dict[str, Any],
        variant_b: Dict[str, Any],
        metric: str = "positive_reply_rate"
    ) -> StatisticalResult:
        """Analyze two variants for statistical significance."""
        
        # Get metric values
        if metric == "open_rate":
            successes_a = variant_a["open_count"]
            successes_b = variant_b["open_count"]
        elif metric == "reply_rate":
            successes_a = variant_a["reply_count"]
            successes_b = variant_b["reply_count"]
        elif metric == "positive_reply_rate":
            successes_a = variant_a["positive_reply_count"]
            successes_b = variant_b["positive_reply_count"]
        else:
            raise ValueError(f"Unknown metric: {metric}")
        
        trials_a = variant_a["sent_count"]
        trials_b = variant_b["sent_count"]
        
        # Calculate rates
        rate_a = successes_a / trials_a if trials_a > 0 else 0
        rate_b = successes_b / trials_b if trials_b > 0 else 0
        
        # Perform test
        z_score, p_value = self.two_proportion_z_test(
            successes_a, trials_a, successes_b, trials_b
        )
        
        # Calculate improvement
        improvement_pct = ((rate_b - rate_a) / rate_a * 100) if rate_a > 0 else 0
        
        # Determine significance
        is_significant = p_value < self.alpha
        
        # Generate recommendation
        if is_significant and improvement_pct > 0:
            recommendation = f"Variant B is {improvement_pct:.1f}% better. Declare winner."
        elif is_significant and improvement_pct < 0:
            recommendation = f"Variant A is {abs(improvement_pct):.1f}% better. Keep A."
        else:
            recommendation = "No significant difference. Continue testing."
        
        return StatisticalResult(
            variant_a=variant_a["variant_id"],
            variant_b=variant_b["variant_id"],
            metric=metric,
            improvement_pct=improvement_pct,
            p_value=p_value,
            is_significant=is_significant,
            confidence_level=self.confidence_level,
            recommendation=recommendation
        )
    
    def generate_report(self, test_results: List[StatisticalResult]) -> str:
        """Generate a text report of test results."""
        lines = [
            "=" * 60,
            "A/B TEST ANALYSIS REPORT",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "=" * 60,
            ""
        ]
        
        for result in test_results:
            lines.extend([
                f"Test: {result.variant_a} vs {result.variant_b}",
                f"Metric: {result.metric}",
                f"Improvement: {result.improvement_pct:+.1f}%",
                f"P-value: {result.p_value:.4f}",
                f"Significant: {'Yes' if result.is_significant else 'No'}",
                f"Recommendation: {result.recommendation}",
                "-" * 40,
                ""
            ])
        
        return "\n".join(lines)


class ContinuousOptimization:
    """Continuously optimize based on A/B test results."""
    
    def __init__(self):
        self.analyzer = ABTestAnalyzer()
    
    async def run_optimization_cycle(self):
        """Run one optimization cycle."""
        from outreach.ab_testing.variants import ABTestManager
        
        manager = ABTestManager()
        
        # Check each test type
        for test_type in ["subject", "body", "cta"]:
            winner_id = await manager.determine_winner(test_type)
            
            if winner_id:
                print(f"Winner determined for {test_type}: {winner_id}")
            else:
                print(f"No clear winner for {test_type} yet")
        
        # Get summary
        summary = await manager.get_test_summary()
        return summary
