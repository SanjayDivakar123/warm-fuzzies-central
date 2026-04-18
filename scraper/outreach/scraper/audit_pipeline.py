"""Integration module for website auditing in the outreach pipeline."""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from outreach.database.models import Business, LeadStatus, WebsiteAudit
from outreach.database import get_db_session
from outreach.database.queries import WebsiteAuditQueries, BusinessQueries
from outreach.scraper.website_auditor import WebsiteAuditor, WebsiteAuditResult

logger = logging.getLogger(__name__)


class WebsiteAuditPipeline:
    """Pipeline for auditing business websites and storing results."""
    
    def __init__(self, max_concurrent: int = 5, timeout: int = 30):
        self.max_concurrent = max_concurrent
        self.timeout = timeout
        self.auditor = WebsiteAuditor(timeout=timeout)
    
    async def audit_businesses_batch(
        self,
        business_ids: Optional[List[int]] = None,
        limit: int = 100,
        skip_existing: bool = True
    ) -> Dict[str, Any]:
        """
        Audit websites for a batch of businesses.
        
        Args:
            business_ids: Specific business IDs to audit. If None, audits businesses without audits.
            limit: Maximum number of businesses to audit
            skip_existing: Skip businesses that already have audits
            
        Returns:
            Summary of audit results
        """
        async with get_db_session() as session:
            # Get businesses to audit
            if business_ids:
                businesses = []
                for bid in business_ids[:limit]:
                    business = await BusinessQueries.get_by_id(session, bid)
                    if business and business.website:
                        businesses.append(business)
            else:
                # Get businesses without audits
                businesses = await WebsiteAuditQueries.get_businesses_without_audit(
                    session, limit=limit
                )
            
            if not businesses:
                logger.info("No businesses found to audit")
                return {"audited": 0, "skipped": 0, "failed": 0, "results": []}
            
            logger.info(f"Starting audit of {len(businesses)} businesses")
            
            # Check for existing audits if skip_existing
            if skip_existing:
                businesses_to_audit = []
                for business in businesses:
                    existing = await WebsiteAuditQueries.get_by_business_id(
                        session, business.id
                    )
                    if not existing:
                        businesses_to_audit.append(business)
                businesses = businesses_to_audit
            
            # Run audits with semaphore for concurrency control
            semaphore = asyncio.Semaphore(self.max_concurrent)
            
            async def audit_with_limit(business: Business) -> Dict[str, Any]:
                async with semaphore:
                    return await self._audit_single_business(business)
            
            # Run all audits
            results = await asyncio.gather(
                *[audit_with_limit(b) for b in businesses],
                return_exceptions=True
            )
            
            # Process results
            summary = {
                "audited": 0,
                "skipped": 0,
                "failed": 0,
                "results": []
            }
            
            for result in results:
                if isinstance(result, Exception):
                    summary["failed"] += 1
                    logger.error(f"Audit failed with exception: {result}")
                elif result.get("status") == "success":
                    summary["audited"] += 1
                    summary["results"].append(result)
                elif result.get("status") == "skipped":
                    summary["skipped"] += 1
                else:
                    summary["failed"] += 1
                    summary["results"].append(result)
            
            logger.info(
                f"Audit batch complete: {summary['audited']} audited, "
                f"{summary['skipped']} skipped, {summary['failed']} failed"
            )
            
            return summary
    
    async def _audit_single_business(self, business: Business) -> Dict[str, Any]:
        """Audit a single business website."""
        try:
            if not business.website:
                return {
                    "business_id": business.id,
                    "business_name": business.name,
                    "status": "skipped",
                    "reason": "No website"
                }
            
            logger.debug(f"Auditing {business.name} at {business.website}")
            
            # Perform audit
            result = self.auditor.audit(business.website)
            
            # Save to database
            await self._save_audit_result(business.id, result)
            
            # Update business status if it was NEW
            if business.status == LeadStatus.NEW:
                async with get_db_session() as session:
                    business = await session.get(Business, business.id)
                    if business:
                        business.status = LeadStatus.ENRICHING
            
            return {
                "business_id": business.id,
                "business_name": business.name,
                "status": "success",
                "url": result.url,
                "issues_found": len(result.issues),
                "talking_points": len(result.talking_points),
                "has_critical_issues": any(
                    i.severity == "critical" for i in result.issues
                )
            }
            
        except Exception as e:
            logger.error(f"Error auditing {business.name}: {e}")
            return {
                "business_id": business.id,
                "business_name": business.name,
                "status": "error",
                "error": str(e)
            }
    
    async def _save_audit_result(
        self,
        business_id: int,
        result: WebsiteAuditResult
    ) -> None:
        """Save audit result to database."""
        async with get_db_session() as session:
            # Check for existing audit
            existing = await WebsiteAuditQueries.get_by_business_id(session, business_id)
            
            if existing:
                # Update existing
                existing.url = result.url
                existing.audited_at = result.audited_at
                existing.load_time_ms = result.load_time_ms
                existing.has_ssl = result.has_ssl
                existing.is_mobile_friendly = result.is_mobile_friendly
                existing.has_contact_form = result.has_contact_form
                existing.has_clear_cta = result.has_clear_cta
                existing.has_meta_description = result.has_meta_description
                existing.has_title_tag = result.has_title_tag
                existing.uses_tables_for_layout = result.uses_tables_for_layout
                existing.has_deprecated_tags = result.has_deprecated_tags
                existing.total_links = result.total_links
                existing.broken_links = result.broken_links
                existing.broken_link_urls = result.broken_link_urls
                existing.issues = [i.__dict__ for i in result.issues]
                existing.talking_points = result.talking_points
                existing.page_title = result.page_title
                existing.meta_description = result.meta_description
                existing.h1_tags = result.h1_tags
            else:
                # Create new
                audit = WebsiteAudit(
                    business_id=business_id,
                    url=result.url,
                    audited_at=result.audited_at,
                    load_time_ms=result.load_time_ms,
                    has_ssl=result.has_ssl,
                    is_mobile_friendly=result.is_mobile_friendly,
                    has_contact_form=result.has_contact_form,
                    has_clear_cta=result.has_clear_cta,
                    has_meta_description=result.has_meta_description,
                    has_title_tag=result.has_title_tag,
                    uses_tables_for_layout=result.uses_tables_for_layout,
                    has_deprecated_tags=result.has_deprecated_tags,
                    total_links=result.total_links,
                    broken_links=result.broken_links,
                    broken_link_urls=result.broken_link_urls,
                    issues=[i.__dict__ for i in result.issues],
                    talking_points=result.talking_points,
                    page_title=result.page_title,
                    meta_description=result.meta_description,
                    h1_tags=result.h1_tags,
                )
                session.add(audit)
    
    async def get_audit_summary(self, business_id: int) -> Optional[Dict[str, Any]]:
        """Get a summary of audit results for a business."""
        async with get_db_session() as session:
            audit = await WebsiteAuditQueries.get_by_business_id(session, business_id)
            
            if not audit:
                return None
            
            return {
                "business_id": business_id,
                "url": audit.url,
                "audited_at": audit.audited_at.isoformat(),
                "score": self._calculate_score(audit),
                "critical_issues": sum(
                    1 for i in (audit.issues or []) if i.get("severity") == "critical"
                ),
                "major_issues": sum(
                    1 for i in (audit.issues or []) if i.get("severity") == "major"
                ),
                "talking_points": audit.talking_points or [],
                "key_problems": [
                    i.get("title") for i in (audit.issues or [])[:3]
                ]
            }
    
    def _calculate_score(self, audit: WebsiteAudit) -> int:
        """Calculate a website health score (0-100)."""
        score = 100
        
        # Deduct for issues
        for issue in (audit.issues or []):
            if issue.get("severity") == "critical":
                score -= 20
            elif issue.get("severity") == "major":
                score -= 10
            elif issue.get("severity") == "minor":
                score -= 5
        
        # Deduct for missing basics
        if not audit.has_ssl:
            score -= 15
        if not audit.is_mobile_friendly:
            score -= 15
        if not audit.has_contact_form:
            score -= 5
        if not audit.has_clear_cta:
            score -= 5
        if not audit.has_meta_description:
            score -= 5
        if not audit.has_title_tag:
            score -= 10
        
        # Deduct for broken links
        if audit.broken_links > 0:
            score -= min(audit.broken_links * 2, 10)
        
        return max(0, score)


async def run_audit_pipeline(
    business_ids: Optional[List[int]] = None,
    limit: int = 100,
    max_concurrent: int = 5
) -> Dict[str, Any]:
    """
    Convenience function to run the audit pipeline.
    
    Usage:
        # Audit all businesses without audits
        results = await run_audit_pipeline()
        
        # Audit specific businesses
        results = await run_audit_pipeline(business_ids=[1, 2, 3])
    """
    pipeline = WebsiteAuditPipeline(max_concurrent=max_concurrent)
    return await pipeline.audit_businesses_batch(
        business_ids=business_ids,
        limit=limit
    )


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Website Audit Pipeline")
    parser.add_argument(
        "--business-ids",
        type=int,
        nargs="+",
        help="Specific business IDs to audit"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Maximum number of businesses to audit"
    )
    parser.add_argument(
        "--max-concurrent",
        type=int,
        default=5,
        help="Maximum concurrent audits"
    )
    
    args = parser.parse_args()
    
    # Run pipeline
    results = asyncio.run(run_audit_pipeline(
        business_ids=args.business_ids,
        limit=args.limit,
        max_concurrent=args.max_concurrent
    ))
    
    # Print results
    print(f"\nAudit Complete:")
    print(f"  Audited: {results['audited']}")
    print(f"  Skipped: {results['skipped']}")
    print(f"  Failed: {results['failed']}")
    
    if results['results']:
        print(f"\nDetails:")
        for r in results['results'][:10]:  # Show first 10
            if r.get('status') == 'success':
                print(f"  ✓ {r['business_name']}: {r['issues_found']} issues, {r['talking_points']} talking points")
            elif r.get('status') == 'error':
                print(f"  ✗ {r['business_name']}: {r.get('error', 'Unknown error')}")