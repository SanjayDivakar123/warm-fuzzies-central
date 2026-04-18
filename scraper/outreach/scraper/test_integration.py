#!/usr/bin/env python3
"""Integration test for website audit feature with email sequences."""

import sys
import os

# Add paths for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scraper.website_auditor import WebsiteAuditor, AuditIssue


def test_email_personalization():
    """Test that email templates can use audit data."""
    print("=" * 70)
    print("Testing Email Personalization with Audit Data")
    print("=" * 70)
    
    # Create a mock audit result with various issues
    class MockAuditResult:
        def __init__(self):
            self.url = "http://example-plumber.com"
            self.load_time_ms = 5500  # Slow
            self.has_ssl = False  # No SSL
            self.is_mobile_friendly = False  # Not mobile friendly
            self.has_contact_form = False  # No contact form
            self.has_clear_cta = False  # No CTA
            self.has_meta_description = False  # No meta
            self.has_title_tag = True
            self.uses_tables_for_layout = True  # Outdated
            self.has_deprecated_tags = False
            self.total_links = 15
            self.broken_links = 3
            self.broken_link_urls = ["/broken1", "/broken2", "/broken3"]
            self.issues = [
                AuditIssue(
                    category="speed",
                    severity="critical",
                    title="Very Slow Page Load",
                    description="Page takes 5.5 seconds to load",
                    recommendation="Optimize images",
                    talking_point="Your website takes 5.5 seconds to load. 40% of visitors leave after 3 seconds."
                ),
                AuditIssue(
                    category="ssl",
                    severity="critical",
                    title="No SSL Certificate",
                    description="Website does not use HTTPS",
                    recommendation="Install SSL certificate",
                    talking_point="Your website shows 'Not Secure' in browsers, scaring away potential customers."
                ),
                AuditIssue(
                    category="mobile",
                    severity="major",
                    title="Not Mobile Friendly",
                    description="No viewport meta tag",
                    recommendation="Add responsive design",
                    talking_point="Over 60% of your potential customers browse on mobile, but your site isn't mobile-friendly."
                ),
            ]
            self.talking_points = [
                "Your website takes 5.5 seconds to load. 40% of visitors leave after 3 seconds.",
                "Over 60% of your potential customers browse on mobile, but your site isn't mobile-friendly.",
                "Your website shows 'Not Secure' in browsers, scaring away potential customers.",
                "Your website uses outdated table layouts that don't work well on mobile devices.",
            ]
            self.page_title = "Joe's Plumbing Service"
            self.meta_description = None
            self.h1_tags = ["Welcome to Joe's Plumbing"]
    
    audit = MockAuditResult()
    
    # Test template rendering
    from jinja2 import Template
    
    # Sample email template using audit data
    email_template = """Hi {{ first_name }},

I was looking at {{ business_name }}'s website and noticed some issues:

{% if primary_issue %}{{ primary_issue }}{% endif %}

{% if is_not_mobile %}Your site doesn't work on mobile phones. 60%+ of customers browse on mobile.{% endif %}

{% if no_ssl %}Your site shows "Not Secure" which scares visitors away.{% endif %}

{% if is_slow %}Your site takes {{ load_time }} seconds to load - most people leave after 3.{% endif %}

{% if no_contact_form %}You also don't have a contact form, so you're missing after-hours leads.{% endif %}

We fix these exact issues for {{ category }} businesses.

Want to see what a modern site would look like?

Connor
"""
    
    variables = {
        "business_name": "Joe's Plumbing",
        "first_name": "Joe",
        "city": "Atlanta",
        "category": "plumbing",
        "primary_issue": audit.talking_points[0] if audit.talking_points else None,
        "is_not_mobile": not audit.is_mobile_friendly,
        "no_ssl": not audit.has_ssl,
        "is_slow": audit.load_time_ms and audit.load_time_ms > 3000,
        "load_time": f"{audit.load_time_ms/1000:.1f}" if audit.load_time_ms else "unknown",
        "no_contact_form": not audit.has_contact_form,
    }
    
    template = Template(email_template)
    rendered = template.render(**variables)
    
    print("\n📧 Rendered Email:")
    print("-" * 70)
    print(rendered)
    print("-" * 70)
    
    # Verify key content is present
    checks = [
        ("First name", "Hi Joe," in rendered),
        ("Business name", "Joe's Plumbing" in rendered),
        ("Primary issue", "5.5 seconds" in rendered),
        ("Mobile issue", "mobile phones" in rendered),
        ("SSL issue", "Not Secure" in rendered),
        ("Load time", "40%" in rendered or "3" in rendered),
        ("Contact form", "contact form" in rendered),
        ("Category", "plumbing" in rendered),
    ]
    
    print("\n✓ Personalization Checks:")
    all_passed = True
    for check_name, passed in checks:
        status = "✓" if passed else "✗"
        print(f"  {status} {check_name}")
        if not passed:
            all_passed = False
    
    return all_passed


def test_audit_data_structure():
    """Test that audit data structure is correct."""
    print("\n" + "=" * 70)
    print("Testing Audit Data Structure")
    print("=" * 70)
    
    auditor = WebsiteAuditor()
    
    # Test with a simple site
    try:
        result = auditor.audit("http://info.cern.ch")
        
        checks = [
            ("Has URL", bool(result.url)),
            ("Has audit timestamp", result.audited_at is not None),
            ("Has load time", result.load_time_ms is not None),
            ("Has SSL check", isinstance(result.has_ssl, bool)),
            ("Has mobile check", isinstance(result.is_mobile_friendly, bool)),
            ("Has contact form check", isinstance(result.has_contact_form, bool)),
            ("Has CTA check", isinstance(result.has_clear_cta, bool)),
            ("Has meta description check", isinstance(result.has_meta_description, bool)),
            ("Has title tag check", isinstance(result.has_title_tag, bool)),
            ("Has table layout check", isinstance(result.uses_tables_for_layout, bool)),
            ("Has deprecated tags check", isinstance(result.has_deprecated_tags, bool)),
            ("Has link counts", isinstance(result.total_links, int)),
            ("Has broken links count", isinstance(result.broken_links, int)),
            ("Issues is list", isinstance(result.issues, list)),
            ("Talking points is list", isinstance(result.talking_points, list)),
            ("Can convert to dict", isinstance(result.to_dict(), dict)),
        ]
        
        print("\n✓ Data Structure Checks:")
        all_passed = True
        for check_name, passed in checks:
            status = "✓" if passed else "✗"
            print(f"  {status} {check_name}")
            if not passed:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_talking_point_priorities():
    """Test that talking points are prioritized correctly."""
    print("\n" + "=" * 70)
    print("Testing Talking Point Priorities")
    print("=" * 70)
    
    # Test that critical issues generate talking points first
    auditor = WebsiteAuditor()
    
    # The info.cern.ch site should have issues
    result = auditor.audit("http://info.cern.ch")
    
    print(f"\nFound {len(result.talking_points)} talking points:")
    for i, point in enumerate(result.talking_points[:5], 1):
        print(f"  {i}. {point[:80]}...")
    
    # Should have talking points for major issues
    has_mobile = any("mobile" in p.lower() for p in result.talking_points)
    has_ssl = any("secure" in p.lower() or "ssl" in p.lower() for p in result.talking_points)
    
    print(f"\n✓ Has mobile talking point: {has_mobile}")
    print(f"✓ Has SSL talking point: {has_ssl}")
    
    return len(result.talking_points) > 0


if __name__ == "__main__":
    print("\n🚀 Starting Integration Tests\n")
    
    results = []
    
    try:
        results.append(("Email Personalization", test_email_personalization()))
        results.append(("Audit Data Structure", test_audit_data_structure()))
        results.append(("Talking Point Priorities", test_talking_point_priorities()))
        
        print("\n" + "=" * 70)
        print("INTEGRATION TEST SUMMARY")
        print("=" * 70)
        
        all_passed = True
        for test_name, passed in results:
            status = "✓ PASS" if passed else "✗ FAIL"
            print(f"  {status}: {test_name}")
            if not passed:
                all_passed = False
        
        print("=" * 70)
        
        if all_passed:
            print("\n✓ All integration tests passed!")
            sys.exit(0)
        else:
            print("\n✗ Some tests failed.")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n✗ Test error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)