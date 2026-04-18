"""Email and phone enrichment module."""

import asyncio
import re
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from urllib.parse import urlparse

import aiohttp
from bs4 import BeautifulSoup

from outreach.database.models import Business, LeadStatus
from outreach.database import get_db_session


@dataclass
class EnrichmentResult:
    """Result of enrichment attempt."""
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    confidence_score: float = 0.0
    sources: List[str] = None
    
    def __post_init__(self):
        if self.sources is None:
            self.sources = []


class EmailEnricher:
    """Enrich business data with owner contact information."""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
        }
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers=self.headers)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _extract_emails(self, text: str) -> List[str]:
        """Extract email addresses from text."""
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return list(set(re.findall(pattern, text)))
    
    def _is_likely_owner_email(self, email: str, business_name: str) -> bool:
        """Check if email is likely the owner's."""
        email_lower = email.lower()
        
        # Skip common non-owner emails
        skip_patterns = [
            'info@', 'contact@', 'support@', 'help@', 'admin@',
            'sales@', 'marketing@', 'hello@', 'team@', 'office@',
            'reservations@', 'booking@', 'noreply@', 'no-reply@',
            'webmaster@', 'hostmaster@', 'postmaster@', 'abuse@'
        ]
        
        for pattern in skip_patterns:
            if pattern in email_lower:
                return False
        
        # Owner emails often contain names
        name_indicators = [
            'owner@', 'founder@', 'ceo@', 'president@', 'director@',
            'manager@', 'gm@', 'chief@'
        ]
        
        for indicator in name_indicators:
            if indicator in email_lower:
                return True
        
        return True
    
    async def _scrape_website(self, url: str) -> Dict[str, Any]:
        """Scrape business website for contact info."""
        result = {
            "emails": [],
            "phones": [],
            "owner_name": None,
            "linkedin": None
        }
        
        if not url or not url.startswith("http"):
            return result
        
        try:
            async with self.session.get(url, timeout=15) as response:
                if response.status != 200:
                    return result
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract emails
                text = soup.get_text()
                result["emails"] = self._extract_emails(text)
                
                # Look for team/about pages
                team_links = soup.find_all('a', href=re.compile(r'(team|about|staff|people)', re.I))
                
                for link in team_links[:3]:  # Check first 3 team links
                    try:
                        team_url = link.get('href')
                        if team_url and not team_url.startswith('http'):
                            parsed = urlparse(url)
                            team_url = f"{parsed.scheme}://{parsed.netloc}{team_url}"
                        
                        async with self.session.get(team_url, timeout=10) as team_response:
                            if team_response.status == 200:
                                team_html = await team_response.text()
                                team_emails = self._extract_emails(team_html)
                                result["emails"].extend(team_emails)
                                
                                # Try to find owner/founder name
                                if not result["owner_name"]:
                                    result["owner_name"] = self._extract_owner_name(team_html)
                                
                    except Exception:
                        continue
                
                # Remove duplicates
                result["emails"] = list(set(result["emails"]))
                
        except Exception as e:
            pass
        
        return result
    
    def _extract_owner_name(self, html: str) -> Optional[str]:
        """Try to extract owner/founder name from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Look for owner/founder titles
        patterns = [
            r'(Owner|Founder|CEO|President|Founder & CEO)[\s]*[:\-]?[\s]*([A-Z][a-z]+[\s][A-Z][a-z]+)',
            r'([A-Z][a-z]+[\s][A-Z][a-z]+)[\s]*[-,][\s]*(Owner|Founder|CEO|President)'
        ]
        
        text = soup.get_text()
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Return the name group
                for group in match.groups():
                    if group and group.lower() not in ['owner', 'founder', 'ceo', 'president']:
                        return group.strip()
        
        return None
    
    async def _verify_email(self, email: str) -> bool:
        """Basic email validation."""
        # Simple regex validation
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False
        
        # Check for disposable domains
        disposable_domains = [
            'tempmail.com', 'throwaway.com', 'mailinator.com',
            'guerrillamail.com', '10minutemail.com'
        ]
        
        domain = email.split('@')[1].lower()
        if domain in disposable_domains:
            return False
        
        return True
    
    async def enrich_business(self, business: Business) -> EnrichmentResult:
        """Enrich a single business with owner contact info."""
        result = EnrichmentResult()
        
        # Scrape website
        if business.website:
            website_data = await self._scrape_website(business.website)
            
            # Filter and validate emails
            for email in website_data.get("emails", []):
                if await self._verify_email(email):
                    if self._is_likely_owner_email(email, business.name):
                        result.owner_email = email
                        result.sources.append("website")
                        result.confidence_score += 0.4
                        break
            
            if website_data.get("owner_name"):
                result.owner_name = website_data["owner_name"]
                result.confidence_score += 0.3
        
        # Use business email as fallback
        if not result.owner_email and business.email:
            if await self._verify_email(business.email):
                result.owner_email = business.email
                result.sources.append("gmb")
                result.confidence_score += 0.3
        
        # Use business phone as owner phone
        if business.phone:
            result.owner_phone = business.phone
            result.confidence_score += 0.2
        
        return result
    
    async def enrich_batch(
        self,
        business_ids: List[int],
        max_concurrent: int = 5
    ) -> Dict[str, Any]:
        """Enrich multiple businesses."""
        enriched_count = 0
        failed_count = 0
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def enrich_with_limit(business_id: int):
            async with semaphore:
                async with get_db_session() as session:
                    business = await session.get(Business, business_id)
                    if not business:
                        return False
                    
                    try:
                        result = await self.enrich_business(business)
                        
                        # Update business
                        business.owner_name = result.owner_name
                        business.owner_email = result.owner_email
                        business.owner_phone = result.owner_phone
                        business.linkedin_url = result.linkedin_url
                        business.enrichment_attempts += 1
                        business.enrichment_last_at = datetime.utcnow()
                        
                        if result.owner_email:
                            business.status = LeadStatus.READY
                            enriched_count += 1
                        elif business.enrichment_attempts >= 3:
                            business.status = LeadStatus.INVALID
                        
                        return True
                        
                    except Exception as e:
                        business.enrichment_attempts += 1
                        return False
        
        tasks = [enrich_with_limit(bid) for bid in business_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            "total": len(business_ids),
            "successful": sum(1 for r in results if r is True),
            "failed": sum(1 for r in results if r is False or isinstance(r, Exception))
        }


# Integration with third-party enrichment services
class ApolloEnricher:
    """Enrichment using Apollo.io API."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.apollo.io/v1"
    
    async def enrich(self, business: Business) -> EnrichmentResult:
        """Enrich using Apollo."""
        result = EnrichmentResult()
        
        # Apollo enrichment logic here
        # Requires API key and proper implementation
        
        return result


class HunterEnricher:
    """Enrichment using Hunter.io API."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.hunter.io/v2"
    
    async def enrich(self, business: Business) -> EnrichmentResult:
        """Enrich using Hunter.io."""
        result = EnrichmentResult()
        
        if not business.website:
            return result
        
        domain = urlparse(business.website).netloc
        
        url = f"{self.base_url}/domain-search"
        params = {
            "domain": domain,
            "api_key": self.api_key
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    emails = data.get("data", {}).get("emails", [])
                    
                    # Find senior/owner emails
                    for email_data in emails:
                        position = email_data.get("position", "").lower()
                        if any(title in position for title in ["owner", "founder", "ceo", "president"]):
                            result.owner_email = email_data.get("value")
                            result.owner_name = email_data.get("first_name", "") + " " + email_data.get("last_name", "")
                            result.confidence_score = email_data.get("confidence", 0) / 100
                            result.sources.append("hunter.io")
                            break
        
        return result
