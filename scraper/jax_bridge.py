#!/usr/bin/env python3
"""Thin bridge for Jax to run the external scraper and emit JSON results."""

import argparse
import asyncio
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from outreach.scraper.gmb import GMBScraper  # noqa: E402
from outreach.scraper.enrichment import EmailEnricher  # noqa: E402


async def enrich_listing(enricher, listing):
    owner_email = None
    owner_name = None

    if listing.website:
      website_data = await enricher._scrape_website(listing.website)
      emails = website_data.get("emails", [])

      for email in emails:
          if await enricher._verify_email(email):
              owner_email = email
              break

      owner_name = website_data.get("owner_name")
    else:
      website_data = {"emails": []}

    return {
        "name": listing.name,
        "company": listing.name,
        "category": listing.category,
        "address": listing.address,
        "city": listing.city,
        "state": listing.state,
        "zip_code": listing.zip_code,
        "phone": listing.phone,
        "website": listing.website,
        "email": owner_email,
        "owner_name": owner_name,
        "rating": listing.rating,
        "review_count": listing.review_count,
        "gmb_url": listing.gmb_url,
        "linkedin_url": None,
    }


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--location", required=True)
    parser.add_argument("--category", required=True)
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--headless", default="true")
    args = parser.parse_args()

    headless = str(args.headless).lower() != "false"

    async with GMBScraper(headless=headless) as scraper:
        listings = await scraper.search_places(
            query=args.category,
            location=args.location,
            max_results=args.limit,
        )

    async with EmailEnricher() as enricher:
        enriched = []
        for listing in listings[: args.limit]:
            if not listing.is_valid():
                continue
            enriched.append(await enrich_listing(enricher, listing))

    payload = {
        "location": args.location,
        "category": args.category,
        "count": len(enriched),
        "results": enriched,
    }
    print(json.dumps(payload))


if __name__ == "__main__":
    asyncio.run(main())
