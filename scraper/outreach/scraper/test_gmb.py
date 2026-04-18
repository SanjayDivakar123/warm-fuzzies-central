#!/usr/bin/env python3
"""Test script for the Playwright-based GMB scraper."""

import asyncio
import sys
import os

# Add the parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from outreach.scraper.gmb import GMBScraper, GMBListing


async def test_scraper():
    """Test the GMB scraper with a sample search."""
    print("=" * 60)
    print("Testing Playwright-based GMB Scraper")
    print("=" * 60)
    
    # Test parameters
    test_category = "plumbers"
    test_location = "Atlanta, GA"
    max_results = 10  # Small number for quick test
    
    print(f"\nSearch: {test_category} in {test_location}")
    print(f"Max results: {max_results}")
    print("-" * 60)
    
    async with GMBScraper(
        delay_min=2.0,
        delay_max=4.0,
        headless=True,
        max_retries=3
    ) as scraper:
        
        print("\n[1/3] Starting search...")
        listings = await scraper.search_places(
            query=test_category,
            location=test_location,
            max_results=max_results
        )
        
        print(f"\n[2/3] Found {len(listings)} listings")
        print("-" * 60)
        
        # Display results
        valid_count = 0
        for i, listing in enumerate(listings, 1):
            print(f"\nListing {i}:")
            print(f"  Name: {listing.name}")
            print(f"  Category: {listing.category or 'N/A'}")
            print(f"  Address: {listing.address or 'N/A'}")
            print(f"  City: {listing.city or 'N/A'}")
            print(f"  State: {listing.state or 'N/A'}")
            print(f"  ZIP: {listing.zip_code or 'N/A'}")
            print(f"  Phone: {listing.phone or 'N/A'}")
            print(f"  Website: {listing.website or 'N/A'}")
            print(f"  Rating: {listing.rating or 'N/A'}")
            print(f"  Reviews: {listing.review_count or 'N/A'}")
            print(f"  GMB ID: {listing.gmb_id or 'N/A'}")
            
            if listing.is_valid():
                valid_count += 1
                print(f"  ✓ Valid: Yes")
            else:
                print(f"  ✗ Valid: No")
        
        print("\n" + "=" * 60)
        print("[3/3] Test Summary")
        print("=" * 60)
        print(f"Total listings found: {len(listings)}")
        print(f"Valid listings: {valid_count}")
        print(f"Invalid listings: {len(listings) - valid_count}")
        
        # Validation checks
        checks = {
            "Listings found": len(listings) > 0,
            "Valid listings": valid_count > 0,
            "Names extracted": all(l.name for l in listings),
            "Addresses extracted": any(l.address for l in listings),
            "Phones extracted": any(l.phone for l in listings),
        }
        
        print("\nValidation Checks:")
        all_passed = True
        for check, passed in checks.items():
            status = "✓ PASS" if passed else "✗ FAIL"
            print(f"  {status}: {check}")
            if not passed:
                all_passed = False
        
        print("\n" + "=" * 60)
        if all_passed:
            print("✓ All checks passed! Scraper is working correctly.")
        else:
            print("⚠ Some checks failed. Review the output above.")
        print("=" * 60)
        
        return all_passed


if __name__ == "__main__":
    try:
        success = asyncio.run(test_scraper())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
        sys.exit(130)
    except Exception as e:
        print(f"\n\nError during test: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
