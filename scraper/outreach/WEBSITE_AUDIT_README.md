# Website Audit Feature

## Overview

The website audit feature automatically analyzes business websites and generates personalized talking points for outreach emails. This creates highly targeted, specific messaging that resonates with prospects.

## Files Created

1. **`scraper/website_auditor.py`** - Core auditing functionality
2. **`scraper/audit_pipeline.py`** - Pipeline for batch auditing
3. **`scraper/test_website_auditor.py`** - Unit tests
4. **`scraper/test_integration.py`** - Integration tests

## Database Changes

### New Table: `website_audits`

Stores audit results for each business:

- `business_id` - Foreign key to businesses table
- `url` - Audited URL
- `audited_at` - Timestamp
- `load_time_ms` - Page load time in milliseconds
- `has_ssl` - SSL certificate present
- `is_mobile_friendly` - Has viewport meta tag
- `has_contact_form` - Has form elements
- `has_clear_cta` - Has call-to-action buttons
- `has_meta_description` - Has meta description
- `has_title_tag` - Has title tag
- `uses_tables_for_layout` - Uses outdated table layouts
- `has_deprecated_tags` - Uses deprecated HTML tags
- `total_links` - Total links found
- `broken_links` - Number of broken links
- `issues` - JSON array of detailed issues
- `talking_points` - JSON array of email talking points

## Audit Checks

### 1. Page Load Speed
- Measures time to load homepage
- Flags sites >3s (major) or >5s (critical)
- Talking point: "Your site takes X seconds to load. 40% of visitors leave after 3 seconds."

### 2. Mobile Responsiveness
- Checks for viewport meta tag
- Talking point: "Over 60% of your potential customers browse on mobile, but your site isn't mobile-friendly."

### 3. Contact Forms
- Looks for `<form>` elements
- Talking point: "I noticed your website doesn't have a contact form. Many customers prefer filling out a quick form rather than calling."

### 4. Clear CTA
- Searches for buttons/links with keywords: "call", "book", "contact", "schedule", "get a quote"
- Talking point: "Your website doesn't have a clear 'Call Now' or 'Book Service' button."

### 5. Outdated Design
- Detects table-based layouts
- Finds deprecated tags (marquee, blink, font, center)
- Talking point: "Your website uses outdated design techniques from the early 2000s."

### 6. Broken Links
- Checks up to 10 pages for 404s
- Talking point: "Your website has X broken links that frustrate visitors and hurt your Google ranking."

### 7. SSL Certificate
- Checks for HTTPS
- Talking point: "Your website shows 'Not Secure' in browsers, which makes visitors worry about their data."

### 8. SEO Basics
- Meta description presence
- Title tag presence and length
- H1 tag presence
- Talking point: "Your website isn't properly set up for Google to find you."

## Email Sequence Updates

### Default Sequence (Updated)

The default 5-step sequence now includes audit-aware templates:

```
Hi {{ first_name }},

I was looking at {{ business_name }}'s website and noticed a few things:

{% if primary_issue %}{{ primary_issue }}{% endif %}
{% if is_not_mobile %}Over 60% of potential customers browse on mobile...{% endif %}
{% if no_ssl %}Your site shows "Not Secure" in browsers...{% endif %}
{% if is_slow %}Your site takes {{ load_time }} seconds to load...{% endif %}
```

### Audit-Focused Sequence (New)

A more aggressive 3-step sequence for businesses with critical issues:

1. **Immediate issue callout** - Direct statement of the biggest problem
2. **Competitor comparison** - "Your competitors are capturing these customers"
3. **Last follow-up** - "This is costing you money every day"

## Usage

### Audit a Single Website

```python
from scraper.website_auditor import audit_website

result = audit_website("https://example.com")
print(f"Found {len(result.issues)} issues")
print(f"Talking points: {result.talking_points}")
```

### Batch Audit Businesses

```python
from scraper.audit_pipeline import run_audit_pipeline

# Audit all businesses without audits
results = await run_audit_pipeline(limit=100)

# Audit specific businesses
results = await run_audit_pipeline(business_ids=[1, 2, 3])
```

### Create Sequence with Audit Data

```python
from sequencer.sequences import SequenceManager

manager = SequenceManager(use_audit_focused=True)
sequence = await manager.create_sequence(
    business_id=123,
    use_audit_data=True
)
```

## Testing

Run the tests:

```bash
# Unit tests
python3 scraper/test_website_auditor.py

# Integration tests
python3 scraper/test_integration.py
```

## Integration with Existing Workflow

1. **Scrape GMB listings** → `gmb.py`
2. **Enrich with contact info** → `enrichment.py`
3. **Audit websites** → `audit_pipeline.py` (NEW)
4. **Create sequences** → `sequences.py` (uses audit data)
5. **Send emails** → `sender.py` (personalized with audit findings)

## Benefits

- **Higher open rates** - Subject lines reference their actual website
- **Higher reply rates** - Specific, actionable feedback builds credibility
- **Better conversion** - Prospects see immediate value
- **Scalable** - Fully automated, no manual research needed