"""Website auditor module for analyzing business websites and generating talking points."""

import asyncio
import logging
import re
import ssl
import time
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set
from urllib.parse import urljoin, urlparse
from datetime import datetime

import requests
from bs4 import BeautifulSoup

# Handle imports for both module and standalone usage
try:
    from outreach.database.models import WebsiteAudit, LeadStatus
    from outreach.database import get_db_session
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class AuditIssue:
    """Represents a specific website issue found during audit."""
    category: str  # speed, mobile, forms, cta, design, links, ssl, seo
    severity: str  # critical, major, minor
    title: str
    description: str
    recommendation: str
    talking_point: str  # Specific angle for outreach email


@dataclass
class WebsiteAuditResult:
    """Complete website audit results."""
    url: str
    audited_at: datetime = field(default_factory=datetime.utcnow)
    
    # Core metrics
    load_time_ms: Optional[int] = None
    has_ssl: bool = False
    is_mobile_friendly: bool = False
    
    # Content analysis
    has_contact_form: bool = False
    has_clear_cta: bool = False
    has_meta_description: bool = False
    has_title_tag: bool = False
    
    # Design analysis
    uses_tables_for_layout: bool = False
    has_deprecated_tags: bool = False
    
    # Link analysis
    total_links: int = 0
    broken_links: int = 0
    broken_link_urls: List[str] = field(default_factory=list)
    
    # Issues found
    issues: List[AuditIssue] = field(default_factory=list)
    
    # Talking points for emails
    talking_points: List[str] = field(default_factory=list)
    
    # Raw data
    page_title: Optional[str] = None
    meta_description: Optional[str] = None
    h1_tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage."""
        return {
            'url': self.url,
            'audited_at': self.audited_at.isoformat(),
            'load_time_ms': self.load_time_ms,
            'has_ssl': self.has_ssl,
            'is_mobile_friendly': self.is_mobile_friendly,
            'has_contact_form': self.has_contact_form,
            'has_clear_cta': self.has_clear_cta,
            'has_meta_description': self.has_meta_description,
            'has_title_tag': self.has_title_tag,
            'uses_tables_for_layout': self.uses_tables_for_layout,
            'has_deprecated_tags': self.has_deprecated_tags,
            'total_links': self.total_links,
            'broken_links': self.broken_links,
            'broken_link_urls': self.broken_link_urls,
            'issues': [self._issue_to_dict(i) for i in self.issues],
            'talking_points': self.talking_points,
            'page_title': self.page_title,
            'meta_description': self.meta_description,
            'h1_tags': self.h1_tags,
        }
    
    def _issue_to_dict(self, issue: AuditIssue) -> Dict[str, str]:
        return {
            'category': issue.category,
            'severity': issue.severity,
            'title': issue.title,
            'description': issue.description,
            'recommendation': issue.recommendation,
            'talking_point': issue.talking_point,
        }


class WebsiteAuditor:
    """Audits business websites for common issues and opportunities."""
    
    # CTA keywords to look for
    CTA_KEYWORDS = [
        'call', 'book', 'contact', 'schedule', 'get a quote', 'request',
        'free estimate', 'get started', 'learn more', 'sign up', 'subscribe',
        'buy now', 'order', 'shop', 'get in touch', 'reach out'
    ]
    
    # Deprecated HTML tags
    DEPRECATED_TAGS = ['marquee', 'blink', 'font', 'center', 'strike', 'big', 'tt']
    
    # Headers for requests
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
    }
    
    def __init__(
        self,
        timeout: int = 30,
        max_pages_to_check: int = 10,
        check_external_links: bool = False
    ):
        self.timeout = timeout
        self.max_pages_to_check = max_pages_to_check
        self.check_external_links = check_external_links
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)
    
    def _normalize_url(self, url: str) -> str:
        """Normalize URL to ensure it has scheme."""
        if not url:
            raise ValueError("URL is required")
        
        url = url.strip()
        
        # Add scheme if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        return url
    
    def _is_valid_url(self, url: str) -> bool:
        """Check if URL is valid and not a mailto/tel/etc."""
        parsed = urlparse(url)
        return parsed.scheme in ('http', 'https') and bool(parsed.netloc)
    
    def _is_same_domain(self, url1: str, url2: str) -> bool:
        """Check if two URLs are on the same domain."""
        domain1 = urlparse(url1).netloc.replace('www.', '')
        domain2 = urlparse(url2).netloc.replace('www.', '')
        return domain1 == domain2
    
    def audit(self, url: str) -> WebsiteAuditResult:
        """Perform complete website audit."""
        url = self._normalize_url(url)
        result = WebsiteAuditResult(url=url)
        
        logger.info(f"Starting audit of {url}")
        
        try:
            # Fetch main page and measure load time
            self._fetch_and_analyze_page(url, result)
            
            # Check SSL
            self._check_ssl(url, result)
            
            # Check for broken links (sample of pages)
            self._check_broken_links(url, result)
            
            # Generate talking points based on issues found
            self._generate_talking_points(result)
            
        except Exception as e:
            logger.error(f"Error auditing {url}: {e}")
            result.issues.append(AuditIssue(
                category='error',
                severity='critical',
                title='Audit Error',
                description=f'Could not complete audit: {str(e)}',
                recommendation='Check if website is accessible',
                talking_point='Your website may be experiencing accessibility issues'
            ))
        
        logger.info(f"Audit complete for {url}. Found {len(result.issues)} issues.")
        return result
    
    def _fetch_and_analyze_page(self, url: str, result: WebsiteAuditResult) -> None:
        """Fetch page and perform initial analysis."""
        start_time = time.time()
        
        try:
            response = self.session.get(url, timeout=self.timeout, allow_redirects=True)
            response.raise_for_status()
            
            # Calculate load time
            result.load_time_ms = int((time.time() - start_time) * 1000)
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract basic info
            result.page_title = soup.title.string.strip() if soup.title else None
            result.has_title_tag = bool(result.page_title)
            
            # Meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                result.meta_description = meta_desc.get('content', '').strip()
                result.has_meta_description = bool(result.meta_description)
            
            # H1 tags
            result.h1_tags = [h1.get_text(strip=True) for h1 in soup.find_all('h1')]
            
            # Check mobile responsiveness (viewport meta)
            viewport = soup.find('meta', attrs={'name': 'viewport'})
            result.is_mobile_friendly = bool(viewport)
            
            # Check for contact forms
            forms = soup.find_all('form')
            result.has_contact_form = bool(forms)
            
            # Check for CTAs
            result.has_clear_cta = self._check_for_ctas(soup)
            
            # Check for deprecated design patterns
            self._check_design_issues(soup, result)
            
            # Analyze performance
            self._analyze_performance(result)
            
            # Analyze SEO
            self._analyze_seo(soup, result)
            
        except requests.exceptions.Timeout:
            result.load_time_ms = -1  # Timeout indicator
            result.issues.append(AuditIssue(
                category='speed',
                severity='critical',
                title='Slow Page Load',
                description='Website took too long to load (>30 seconds)',
                recommendation='Optimize server response time and reduce page weight',
                talking_point='Your website is loading slowly, which frustrates visitors and hurts search rankings'
            ))
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch website: {str(e)}")
    
    def _check_for_ctas(self, soup: BeautifulSoup) -> bool:
        """Check for clear call-to-action buttons/links."""
        # Check buttons
        buttons = soup.find_all(['button', 'a'], class_=re.compile(r'cta|call|book|contact|schedule', re.I))
        if buttons:
            return True
        
        # Check link text
        for link in soup.find_all('a'):
            text = link.get_text(strip=True).lower()
            if any(keyword in text for keyword in self.CTA_KEYWORDS):
                return True
        
        # Check buttons by text
        for button in soup.find_all(['button', 'input']):
            text = button.get_text(strip=True).lower() or button.get('value', '').lower()
            if any(keyword in text for keyword in self.CTA_KEYWORDS):
                return True
        
        return False
    
    def _check_design_issues(self, soup: BeautifulSoup, result: WebsiteAuditResult) -> None:
        """Check for outdated design patterns."""
        # Check for table-based layouts
        tables = soup.find_all('table')
        if tables:
            # Check if tables are used for layout (not just data)
            for table in tables:
                if not table.find('th') and table.find('img'):
                    result.uses_tables_for_layout = True
                    break
        
        # Check for deprecated tags
        for tag in self.DEPRECATED_TAGS:
            if soup.find(tag):
                result.has_deprecated_tags = True
                break
        
        # Add issues for design problems
        if result.uses_tables_for_layout:
            result.issues.append(AuditIssue(
                category='design',
                severity='major',
                title='Table-Based Layout',
                description='Website uses HTML tables for layout instead of modern CSS',
                recommendation='Redesign using CSS Grid or Flexbox for modern, responsive layouts',
                talking_point='Your website uses outdated table layouts that don\'t work well on mobile devices'
            ))
        
        if result.has_deprecated_tags:
            result.issues.append(AuditIssue(
                category='design',
                severity='minor',
                title='Deprecated HTML Tags',
                description='Website uses outdated HTML tags that are no longer supported',
                recommendation='Update to modern HTML5 standards',
                talking_point='Your website uses outdated code that may not display correctly in modern browsers'
            ))
    
    def _analyze_performance(self, result: WebsiteAuditResult) -> None:
        """Analyze page load performance."""
        if result.load_time_ms is None:
            return
        
        if result.load_time_ms == -1:
            # Already handled in timeout case
            return
        
        # Page load speed thresholds
        if result.load_time_ms > 5000:
            result.issues.append(AuditIssue(
                category='speed',
                severity='critical',
                title='Very Slow Page Load',
                description=f'Page takes {result.load_time_ms/1000:.1f} seconds to load',
                recommendation='Optimize images, minify code, and consider a faster hosting provider',
                talking_point='Your website takes too long to load - visitors leave after 3 seconds'
            ))
        elif result.load_time_ms > 3000:
            result.issues.append(AuditIssue(
                category='speed',
                severity='major',
                title='Slow Page Load',
                description=f'Page takes {result.load_time_ms/1000:.1f} seconds to load',
                recommendation='Optimize images and reduce server response time',
                talking_point='Your website could load faster, improving visitor experience and search rankings'
            ))
    
    def _analyze_seo(self, soup: BeautifulSoup, result: WebsiteAuditResult) -> None:
        """Analyze basic SEO elements."""
        # Missing meta description
        if not result.has_meta_description:
            result.issues.append(AuditIssue(
                category='seo',
                severity='major',
                title='Missing Meta Description',
                description='Page lacks a meta description tag',
                recommendation='Add a compelling meta description (150-160 characters)',
                talking_point='Your website is missing descriptions that help you show up in Google searches'
            ))
        
        # Missing or poor title
        if not result.page_title:
            result.issues.append(AuditIssue(
                category='seo',
                severity='critical',
                title='Missing Page Title',
                description='Page has no title tag',
                recommendation='Add a descriptive, keyword-rich title tag (50-60 characters)',
                talking_point='Your website pages don\'t have titles, so Google can\'t properly index them'
            ))
        elif len(result.page_title) < 10:
            result.issues.append(AuditIssue(
                category='seo',
                severity='minor',
                title='Short Page Title',
                description=f'Page title is only {len(result.page_title)} characters',
                recommendation='Expand title to 50-60 characters with relevant keywords',
                talking_point='Your website titles are too short to be effective in search results'
            ))
        
        # Multiple H1 tags
        if len(result.h1_tags) > 1:
            result.issues.append(AuditIssue(
                category='seo',
                severity='minor',
                title='Multiple H1 Tags',
                description=f'Page has {len(result.h1_tags)} H1 tags (should have 1)',
                recommendation='Use only one H1 tag per page for proper heading hierarchy',
                talking_point='Your website has multiple main headings, confusing search engines about your content'
            ))
        
        # No H1 tag
        if len(result.h1_tags) == 0:
            result.issues.append(AuditIssue(
                category='seo',
                severity='major',
                title='Missing H1 Tag',
                description='Page has no H1 heading',
                recommendation='Add a clear, keyword-rich H1 tag to each page',
                talking_point='Your website pages lack main headings that help Google understand your business'
            ))
    
    def _check_ssl(self, url: str, result: WebsiteAuditResult) -> None:
        """Check if website has valid SSL certificate."""
        parsed = urlparse(url)
        
        # Check if HTTPS
        if parsed.scheme != 'https':
            result.has_ssl = False
            result.issues.append(AuditIssue(
                category='ssl',
                severity='critical',
                title='No SSL Certificate',
                description='Website does not use HTTPS encryption',
                recommendation='Install an SSL certificate (free with Let\'s Encrypt)',
                talking_point='Your website isn\'t secure - visitors see "Not Secure" warnings in their browser'
            ))
            return
        
        # Verify SSL is valid
        try:
            hostname = parsed.netloc.replace('www.', '')
            context = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    result.has_ssl = bool(cert)
        except Exception as e:
            logger.debug(f"SSL check failed: {e}")
            result.has_ssl = True  # Assume valid if we got here via HTTPS
    
    def _check_broken_links(self, url: str, result: WebsiteAuditResult) -> None:
        """Check for broken links on the website."""
        try:
            response = self.session.get(url, timeout=self.timeout)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Collect all links
            links = set()
            for link in soup.find_all('a', href=True):
                href = link['href']
                full_url = urljoin(url, href)
                if self._is_valid_url(full_url):
                    links.add(full_url)
            
            result.total_links = len(links)
            
            # Sample links to check (limit for performance)
            links_to_check = list(links)[:self.max_pages_to_check]
            
            for link_url in links_to_check:
                try:
                    # Only check internal links unless configured otherwise
                    if not self.check_external_links and not self._is_same_domain(link_url, url):
                        continue
                    
                    head_response = self.session.head(link_url, timeout=10, allow_redirects=True)
                    if head_response.status_code >= 400:
                        result.broken_links += 1
                        result.broken_link_urls.append(link_url)
                except Exception:
                    result.broken_links += 1
                    result.broken_link_urls.append(link_url)
            
            # Add issue if broken links found
            if result.broken_links > 0:
                result.issues.append(AuditIssue(
                    category='links',
                    severity='major' if result.broken_links > 3 else 'minor',
                    title='Broken Links Found',
                    description=f'Found {result.broken_links} broken links on the website',
                    recommendation='Fix or remove broken links to improve user experience and SEO',
                    talking_point=f'Your website has {result.broken_links} broken links that frustrate visitors and hurt your Google ranking'
                ))
        
        except Exception as e:
            logger.debug(f"Error checking broken links: {e}")
    
    def _generate_talking_points(self, result: WebsiteAuditResult) -> None:
        """Generate personalized talking points for outreach emails."""
        talking_points = []
        
        # Mobile responsiveness
        if not result.is_mobile_friendly:
            talking_points.append(
                f"Over 60% of your potential customers browse on mobile, but your site isn't mobile-friendly. "
                f"You're losing business every day."
            )
        
        # Contact form
        if not result.has_contact_form:
            talking_points.append(
                f"I noticed your website doesn't have a contact form. "
                f"Many customers prefer filling out a quick form rather than calling. "
                f"You're missing those leads."
            )
        
        # No clear CTA
        if not result.has_clear_cta:
            talking_points.append(
                f"Your website doesn't have a clear 'Call Now' or 'Book Service' button. "
                f"Visitors need to be told exactly what to do next."
            )
        
        # Speed issues
        if result.load_time_ms and result.load_time_ms > 3000:
            talking_points.append(
                f"Your website takes {result.load_time_ms/1000:.1f} seconds to load. "
                f"Studies show 40% of visitors leave if a site takes more than 3 seconds."
            )
        
        # SSL/Security
        if not result.has_ssl:
            talking_points.append(
                f"Your website shows 'Not Secure' in browsers. "
                f"This scares away potential customers who worry about their data."
            )
        
        # Outdated design
        if result.uses_tables_for_layout or result.has_deprecated_tags:
            talking_points.append(
                f"Your website uses outdated design techniques from the early 2000s. "
                f"Modern customers judge your business by your website's appearance."
            )
        
        # SEO issues
        if not result.has_meta_description or not result.page_title:
            talking_points.append(
                f"Your website isn't properly set up for Google to find you. "
                f"You're essentially invisible to people searching for your services."
            )
        
        # Broken links
        if result.broken_links > 0:
            talking_points.append(
                f"Your website has {result.broken_links} broken links. "
                f"This makes your business look unprofessional and hurts your Google ranking."
            )
        
        # Generic fallback if no major issues
        if not talking_points:
            talking_points.append(
                f"I was looking at your website and think it could benefit from a modern refresh. "
                f"A redesigned site could help you attract more customers and stand out from competitors."
            )
        
        result.talking_points = talking_points


# Import socket here to avoid issues with module loading
import socket


class WebsiteAuditManager:
    """Manages website audits and database storage."""
    
    def __init__(self):
        self.auditor = WebsiteAuditor()
    
    async def audit_business(self, business_id: int) -> Optional[WebsiteAuditResult]:
        """Audit a business website and save results to database."""
        if not DATABASE_AVAILABLE:
            raise RuntimeError("Database not available")
        
        from outreach.database.queries import BusinessQueries
        
        async with get_db_session() as session:
            # Get business
            business = await BusinessQueries.get_by_id(session, business_id)
            if not business:
                logger.error(f"Business {business_id} not found")
                return None
            
            if not business.website:
                logger.warning(f"Business {business_id} has no website")
                return None
            
            # Perform audit
            result = self.auditor.audit(business.website)
            
            # Save to database
            await self._save_audit_result(session, business_id, result)
            
            # Update business status
            business.status = LeadStatus.READY
            
            return result
    
    async def _save_audit_result(
        self,
        session,
        business_id: int,
        result: WebsiteAuditResult
    ) -> None:
        """Save audit result to database."""
        # Check if audit already exists
        from sqlalchemy import select
        existing = await session.execute(
            select(WebsiteAudit).where(WebsiteAudit.business_id == business_id)
        )
        existing_audit = existing.scalar_one_or_none()
        
        if existing_audit:
            # Update existing
            existing_audit.url = result.url
            existing_audit.audited_at = result.audited_at
            existing_audit.load_time_ms = result.load_time_ms
            existing_audit.has_ssl = result.has_ssl
            existing_audit.is_mobile_friendly = result.is_mobile_friendly
            existing_audit.has_contact_form = result.has_contact_form
            existing_audit.has_clear_cta = result.has_clear_cta
            existing_audit.has_meta_description = result.has_meta_description
            existing_audit.has_title_tag = result.has_title_tag
            existing_audit.uses_tables_for_layout = result.uses_tables_for_layout
            existing_audit.has_deprecated_tags = result.has_deprecated_tags
            existing_audit.total_links = result.total_links
            existing_audit.broken_links = result.broken_links
            existing_audit.broken_link_urls = result.broken_link_urls
            existing_audit.issues = [i.__dict__ for i in result.issues]
            existing_audit.talking_points = result.talking_points
            existing_audit.page_title = result.page_title
            existing_audit.meta_description = result.meta_description
            existing_audit.h1_tags = result.h1_tags
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
    
    async def get_audit_for_business(self, business_id: int) -> Optional[WebsiteAuditResult]:
        """Retrieve audit result for a business."""
        if not DATABASE_AVAILABLE:
            raise RuntimeError("Database not available")
        
        from sqlalchemy import select
        
        async with get_db_session() as session:
            result = await session.execute(
                select(WebsiteAudit).where(WebsiteAudit.business_id == business_id)
            )
            audit = result.scalar_one_or_none()
            
            if not audit:
                return None
            
            # Convert back to WebsiteAuditResult
            return WebsiteAuditResult(
                url=audit.url,
                audited_at=audit.audited_at,
                load_time_ms=audit.load_time_ms,
                has_ssl=audit.has_ssl,
                is_mobile_friendly=audit.is_mobile_friendly,
                has_contact_form=audit.has_contact_form,
                has_clear_cta=audit.has_clear_cta,
                has_meta_description=audit.has_meta_description,
                has_title_tag=audit.has_title_tag,
                uses_tables_for_layout=audit.uses_tables_for_layout,
                has_deprecated_tags=audit.has_deprecated_tags,
                total_links=audit.total_links,
                broken_links=audit.broken_links,
                broken_link_urls=audit.broken_link_urls or [],
                issues=[AuditIssue(**i) for i in (audit.issues or [])],
                talking_points=audit.talking_points or [],
                page_title=audit.page_title,
                meta_description=audit.meta_description,
                h1_tags=audit.h1_tags or [],
            )


# Convenience function for standalone usage
def audit_website(url: str) -> WebsiteAuditResult:
    """Audit a single website and return results."""
    auditor = WebsiteAuditor()
    return auditor.audit(url)