"""Google My Business scraper module using Playwright for direct Google Maps scraping."""

import asyncio
import json
import re
import urllib.parse
from dataclasses import dataclass
from typing import List, Optional, Dict, Any, Set
from datetime import datetime
import random
import time

from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from playwright_stealth import Stealth

# Handle imports for both module and standalone usage
try:
    from outreach.database.models import Business, ScrapingJob, LeadStatus
    from outreach.database import get_db_session
    from outreach.config import settings
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False
    settings = None

import logging

logger = logging.getLogger(__name__)


@dataclass
class GMBListing:
    """Represents a GMB listing."""
    gmb_id: Optional[str]
    name: str
    category: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    rating: Optional[float]
    review_count: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    gmb_url: Optional[str]
    hours: Optional[Dict[str, str]]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for validation."""
        return {
            'gmb_id': self.gmb_id,
            'name': self.name,
            'category': self.category,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'phone': self.phone,
            'website': self.website,
            'rating': self.rating,
            'review_count': self.review_count,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'gmb_url': self.gmb_url,
            'hours': self.hours,
        }

    def is_valid(self) -> bool:
        """Validate the listing has minimum required data."""
        if not self.name or len(self.name.strip()) < 2:
            return False
        # Must have at least one contact method or location data
        # Address alone is sufficient since it contains location info
        if not any([self.phone, self.website, self.address, self.gmb_url]):
            return False
        return True


class GMBScraper:
    """Scraper for Google My Business listings using Playwright."""
    
    def __init__(
        self,
        delay_min: float = 2.0,
        delay_max: float = 4.0,
        headless: bool = True,
        max_retries: int = 3
    ):
        self.delay_min = delay_min
        self.delay_max = delay_max
        self.headless = headless
        self.max_retries = max_retries
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self._seen_ids: Set[str] = set()
        
    async def __aenter__(self):
        """Initialize Playwright browser."""
        self.playwright = await async_playwright().start()
        
        # Launch browser with stealth settings
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-dev-shm-usage',
                '--no-sandbox',
            ]
        )
        
        # Create context with realistic viewport and locale
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            locale='en-US',
            timezone_id='America/New_York',
            geolocation={'latitude': 33.749, 'longitude': -84.388},
            permissions=['geolocation'],
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0.36'
        )
        
        # Add stealth scripts to avoid detection
        await self.context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            window.chrome = { runtime: {} };
        """)
        
        self.page = await self.context.new_page()
        # Apply stealth to avoid detection
        await Stealth().apply_stealth_async(self.page)
        
        logger.info("Playwright browser initialized")
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up browser resources."""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("Playwright browser closed")
    
    async def _random_delay(self):
        """Random delay to avoid rate limiting."""
        delay = random.uniform(self.delay_min, self.delay_max)
        await asyncio.sleep(delay)
    
    async def _scroll_results(self):
        """Scroll the results panel to load more listings."""
        try:
            # Find the scrollable results container
            scroll_script = """
                () => {
                    const scrollable = document.querySelector('[role="feed"]') || 
                                      document.querySelector('div[aria-label*="results"]') ||
                                      document.querySelector('div.m6QErb') ||
                                      document.querySelector('[role="main"]');
                    if (scrollable) {
                        const currentScroll = scrollable.scrollTop;
                        scrollable.scrollTop = scrollable.scrollHeight;
                        return {
                            scrollHeight: scrollable.scrollHeight,
                            scrolled: scrollable.scrollTop > currentScroll
                        };
                    }
                    return { scrollHeight: 0, scrolled: false };
                }
            """
            result = await self.page.evaluate(scroll_script)
            logger.debug(f"Scrolled: {result}")
            await asyncio.sleep(1.5)  # Wait for content to load
        except Exception as e:
            logger.debug(f"Scroll error: {e}")
    
    async def _click_next_page(self) -> bool:
        """Click next page button if available."""
        try:
            # Look for next page button
            next_button = await self.page.query_selector('button[aria-label="Next page"], button[jsaction*="next"], a[aria-label="Next"]')
            if next_button:
                is_disabled = await next_button.get_attribute('disabled')
                if not is_disabled:
                    await next_button.click()
                    await self._random_delay()
                    return True
            return False
        except Exception:
            return False
    
    def _extract_gmb_id(self, url: str) -> Optional[str]:
        """Extract GMB ID from URL."""
        if not url:
            return None
        
        patterns = [
            r"1s([^!]+)",
            r"place/([^/]+)",
            r"cid=([^&]+)",
            r"data=.*!1s([^!]+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def _parse_address(self, address: str) -> Dict[str, Optional[str]]:
        """Parse US address into components."""
        result = {"city": None, "state": None, "zip": None}
        
        if not address:
            return result
        
        # Clean up the address (remove bullet points)
        address = address.replace('· ', '').strip()
        
        # Try to extract ZIP
        zip_match = re.search(r"\b(\d{5}(-\d{4})?)\b", address)
        if zip_match:
            result["zip"] = zip_match.group(1)
        
        # Try to extract State (2-letter code)
        state_match = re.search(r",\s*([A-Z]{2})\s+\d", address)
        if state_match:
            result["state"] = state_match.group(1)
        
        # Try to extract City
        parts = [p.strip() for p in address.split(",")]
        if len(parts) >= 2:
            result["city"] = parts[-2] if result["state"] else parts[-1]
        
        return result
    
    def _parse_rating(self, rating_text: str) -> Optional[float]:
        """Extract rating from text."""
        if not rating_text:
            return None
        match = re.search(r"(\d+\.?\d*)", rating_text.replace(",", ""))
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None
        return None
    
    def _parse_review_count(self, text: str) -> Optional[int]:
        """Extract review count from text."""
        if not text:
            return None
        # Handle formats like "(123)", "123 reviews", "1.2K"
        match = re.search(r"([\d.]+)([Kk]?)", text.replace(",", "").replace("(", "").replace(")", ""))
        if match:
            try:
                count = float(match.group(1))
                if match.group(2).lower() == 'k':
                    count *= 1000
                return int(count)
            except ValueError:
                return None
        return None
    
    async def _extract_listing_details(self, card_data: Dict[str, Any]) -> Optional[GMBListing]:
        """Extract details from card data extracted via JavaScript."""
        try:
            name = card_data.get('name')
            if not name:
                return None
            
            address = card_data.get('address')
            phone = card_data.get('phone')
            website = card_data.get('website')
            rating = card_data.get('rating')
            review_count = card_data.get('review_count')
            gmb_url = card_data.get('gmb_url')
            category = card_data.get('category')
            
            # Parse address components
            addr_parts = self._parse_address(address) if address else {}
            
            # Extract GMB ID
            gmb_id = self._extract_gmb_id(gmb_url) if gmb_url else None
            
            # Clean up address (remove bullet points)
            clean_address = address.replace('· ', '').strip() if address else None
            
            listing = GMBListing(
                gmb_id=gmb_id,
                name=name,
                category=category,
                address=clean_address,
                city=addr_parts.get("city"),
                state=addr_parts.get("state"),
                zip_code=addr_parts.get("zip"),
                phone=phone,
                website=website,
                rating=rating,
                review_count=review_count,
                latitude=None,
                longitude=None,
                gmb_url=gmb_url,
                hours=None
            )
            
            return listing if listing.is_valid() else None
            
        except Exception as e:
            logger.debug(f"Error extracting listing details: {e}")
            return None
    
    async def _get_listings_from_page(self) -> List[GMBListing]:
        """Get all listings from the current page using JavaScript extraction."""
        listings = []
        
        try:
            # Wait for results to load
            await self.page.wait_for_selector('[role="feed"], [role="main"]', timeout=15000)
            
            # Extract listing data using JavaScript - properly escaped for Python
            extract_script = """
                () => {
                    const results = [];
                    
                    // Find all place links - these are the main business cards
                    const placeLinks = document.querySelectorAll('a[href*="/maps/place/"]');
                    
                    placeLinks.forEach(link => {
                        const data = {};
                        
                        // Get the href for GMB URL
                        data.gmb_url = link.href || null;
                        
                        // Try to get name - look for heading elements within or near the link
                        // The name is usually in a div with fontHeadlineSmall class
                        let nameElem = link.querySelector('div.fontHeadlineSmall, .fontHeadlineSmall') ||
                                        link.querySelector('span.fontHeadlineSmall');
                        if (!nameElem && link.parentElement) {
                            nameElem = link.parentElement.querySelector('div.fontHeadlineSmall');
                        }
                        data.name = nameElem ? nameElem.textContent.trim() : null;
                        
                        // If no name found, try getting it from the link text
                        if (!data.name) {
                            // Get all text content and find the business name (usually first significant text)
                            const allText = link.textContent.trim().split(String.fromCharCode(10))
                                .map(t => t.trim()).filter(t => t.length > 0);
                            if (allText.length > 0) {
                                data.name = allText[0];
                            }
                        }
                        
                        // Get the container for this listing to find other details
                        let container = link.closest('[role="article"]');
                        if (!container) {
                            container = link.closest('div[jsaction*="mouseover"]');
                        }
                        if (!container && link.parentElement) {
                            container = link.parentElement.parentElement;
                        }
                        
                        if (container) {
                            // Try to get address - usually contains street address pattern
                            const allSpans = container.querySelectorAll('span');
                            for (const span of allSpans) {
                                const text = span.textContent.trim();
                                // Look for address patterns (contains numbers, street types, etc.)
                                if (/[0-9]/.test(text) && (text.indexOf('St') > -1 || text.indexOf('Ave') > -1 || text.indexOf('Rd') > -1 || text.indexOf('Dr') > -1 || text.indexOf('Blvd') > -1 || text.indexOf('Way') > -1 || text.indexOf('NE') > -1 || text.indexOf('NW') > -1 || text.indexOf('SE') > -1 || text.indexOf('SW') > -1)) {
                                    data.address = text;
                                    break;
                                }
                            }
                            
                            // Try to get phone
                            const phoneLink = container.querySelector('a[href^="tel:"]');
                            if (phoneLink) {
                                data.phone = phoneLink.textContent.trim();
                            }
                            
                            // Try to get website
                            const webLink = container.querySelector('a[href^="http"]:not([href*="google"]):not([href^="tel:"])');
                            if (webLink) {
                                data.website = webLink.href;
                            }
                            
                            // Try to get rating
                            const ratingElem = container.querySelector('span[role="img"][aria-label*="star"], .fontDisplayLarge');
                            if (ratingElem) {
                                const ratingMatch = ratingElem.textContent.match(/([0-9]+\.?[0-9]*)/);
                                if (ratingMatch) {
                                    data.rating = parseFloat(ratingMatch[1]);
                                }
                            }
                            
                            // Try to get review count
                            const allElements = container.querySelectorAll('*');
                            for (const el of allElements) {
                                const text = el.textContent;
                                if (text.indexOf('(') > -1 && text.indexOf(')') > -1 && /[0-9]/.test(text)) {
                                    const reviewMatch = text.match(/\(([0-9][0-9,]*)\)/);
                                    if (reviewMatch) {
                                        data.review_count = parseInt(reviewMatch[1].replace(/,/g, ''));
                                        break;
                                    }
                                }
                            }
                            
                            // Try to get category - usually appears after the name
                            const catElem = container.querySelector('.W4Efsd span:first-child');
                            if (catElem && catElem.textContent.indexOf('·') === -1) {
                                data.category = catElem.textContent.trim();
                            }
                        }
                        
                        if (data.name) {
                            results.push(data);
                        }
                    });
                    
                    return results;
                }
            """
            
            cards_data = await self.page.evaluate(extract_script)
            logger.info(f"Extracted {len(cards_data)} cards from page")
            
            for card_data in cards_data[:20]:  # Process up to 20 per page
                try:
                    listing = await self._extract_listing_details(card_data)
                    if listing:
                        listings.append(listing)
                        logger.debug(f"Added listing: {listing.name}")
                        
                except Exception as e:
                    logger.debug(f"Error processing card: {e}")
                    continue
                
                await asyncio.sleep(0.1)  # Small delay between listings
                
        except Exception as e:
            logger.warning(f"Error getting listings from page: {e}")
        
        return listings
    
    async def search_places(
        self,
        query: str,
        location: str,
        max_results: int = 100
    ) -> List[GMBListing]:
        """Search for places using Google Maps with pagination."""
        final_listings = []
        self._seen_ids.clear()
        
        search_query = f"{query} in {location}"
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://www.google.com/maps/search/{encoded_query}"
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Navigating to: {url}")
                # Use domcontentloaded instead of networkidle for faster loading
                await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
                
                # Wait for the page to be more fully loaded
                await asyncio.sleep(5)
                
                # Accept cookies if prompted
                try:
                    cookie_btn = await self.page.wait_for_selector('button:has-text("Accept all"), button:has-text("I agree")', timeout=5000)
                    if cookie_btn:
                        await cookie_btn.click()
                        await asyncio.sleep(1)
                except Exception:
                    pass
                
                await self._random_delay()
                break
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt == self.max_retries - 1:
                    return final_listings
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        pages_scrolled = 0
        max_pages = (max_results // 20) + 2  # Estimate pages needed
        
        while len(final_listings) < max_results and pages_scrolled < max_pages:
            # Get listings from current view
            page_listings = await self._get_listings_from_page()
            
            for listing in page_listings:
                # Use name as fallback if gmb_id is None
                seen_key = listing.gmb_id if listing.gmb_id else listing.name
                if seen_key not in self._seen_ids:
                    final_listings.append(listing)
                    self._seen_ids.add(seen_key)
                    
                    if len(final_listings) >= max_results:
                        break
            
            # Scroll to load more
            prev_count = len(final_listings)
            await self._scroll_results()
            await self._random_delay()
            
            # Check if we got new results
            if len(final_listings) == prev_count:
                # Try clicking next page
                has_next = await self._click_next_page()
                if not has_next:
                    break
            
            pages_scrolled += 1
        
        logger.info(f"Search completed: found {len(final_listings)} listings")
        return final_listings[:max_results]
    
    async def scrape_to_database(
        self,
        location: str,
        category: str,
        radius_miles: int = 25
    ) -> Dict[str, Any]:
        """Scrape GMB and save to database."""
        if not DATABASE_AVAILABLE:
            raise RuntimeError("Database not available. Cannot save to database.")
        
        logger.info(f"Starting scrape job: {category} in {location}")
        
        # Create scraping job record
        async with get_db_session() as session:
            job = ScrapingJob(
                location=location,
                category=category,
                radius_miles=radius_miles,
                status="running"
            )
            session.add(job)
            await session.flush()
            job_id = job.id
        
        try:
            # Perform scraping
            listings = await self.search_places(
                query=category,
                location=location,
                max_results=settings.gmb_results_per_search if settings else 100
            )
            
            businesses_added = 0
            businesses_skipped = 0
            invalid_count = 0
            
            async with get_db_session() as session:
                for listing in listings:
                    # Validate listing
                    if not listing.is_valid():
                        invalid_count += 1
                        continue
                    
                    # Check if business already exists
                    existing = None
                    if listing.gmb_id:
                        from outreach.database.queries import BusinessQueries
                        existing = await BusinessQueries.get_by_gmb_id(
                            session, listing.gmb_id
                        )
                    
                    if existing:
                        businesses_skipped += 1
                        continue
                    
                    # Create new business
                    business = Business(
                        gmb_id=listing.gmb_id,
                        name=listing.name,
                        category=listing.category or category,
                        address=listing.address,
                        city=listing.city,
                        state=listing.state,
                        zip_code=listing.zip_code,
                        phone=listing.phone,
                        website=listing.website,
                        rating=listing.rating,
                        review_count=listing.review_count,
                        latitude=listing.latitude,
                        longitude=listing.longitude,
                        gmb_url=listing.gmb_url,
                        hours=listing.hours,
                        status=LeadStatus.NEW
                    )
                    session.add(business)
                    businesses_added += 1
                
                # Update job status
                job = await session.get(ScrapingJob, job_id)
                job.status = "completed"
                job.businesses_found = len(listings)
                job.businesses_added = businesses_added
                job.completed_at = datetime.utcnow()
            
            return {
                "job_id": job_id,
                "found": len(listings),
                "added": businesses_added,
                "skipped": businesses_skipped,
                "invalid": invalid_count,
                "status": "success"
            }
            
        except Exception as e:
            async with get_db_session() as session:
                job = await session.get(ScrapingJob, job_id)
                job.status = "failed"
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
            
            logger.error(f"Scraping job {job_id} failed: {e}")
            return {
                "job_id": job_id,
                "error": str(e),
                "status": "failed"
            }


async def scrape_gmb_to_database(
    location: str,
    category: str,
    radius_miles: int = 25
) -> Dict[str, Any]:
    """Convenience function to scrape GMB using settings from config.

    This function creates a scraper instance with settings from the config
    and runs the scrape operation.
    """
    if not DATABASE_AVAILABLE or not settings:
        raise RuntimeError("Database not available. Cannot use this function.")
    
    async with GMBScraper(
        delay_min=settings.scraping_delay_min_seconds,
        delay_max=settings.scraping_delay_max_seconds,
        headless=settings.scraping_headless,
        max_retries=settings.scraping_max_retries
    ) as scraper:
        return await scraper.scrape_to_database(
            location=location,
            category=category,
            radius_miles=radius_miles
        )


# Legacy class name for backwards compatibility
SerpAPIGMBScraper = GMBScraper
