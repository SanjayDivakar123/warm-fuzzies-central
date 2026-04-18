# Connor Smith Outreach System - Implementation Guide

## Overview

Complete cold outreach system with:
- GMB scraping
- Email enrichment
- 15-20 email account rotation
- 14-day warm-up protocol (5→50 emails/day)
- 5-step follow-up sequences
- A/B testing
- Reply detection
- Cold call list export

## Quick Start

### 1. Install & Setup

```bash
cd /home/ubuntu/clients/client-connor-smith
./setup.sh
```

### 2. Configure Environment

Edit `.env` file:
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/connor_outreach
DEFAULT_FROM_NAME=Connor Smith
REPLY_TO_EMAIL=your@email.com
```

### 3. Add Email Accounts

Use the API or directly insert into database:

```python
from outreach.database import get_db_session
from outreach.database.models import EmailAccount

async with get_db_session() as session:
    account = EmailAccount(
        email="connor1@yourdomain.com",
        display_name="Connor Smith",
        smtp_host="smtp.gmail.com",
        smtp_port=587,
        smtp_username="connor1@yourdomain.com",
        smtp_password="your-app-password",
        imap_host="imap.gmail.com",
        imap_port=993,
        imap_username="connor1@yourdomain.com",
        imap_password="your-app-password",
        status="warming",
        daily_limit=5
    )
    session.add(account)
```

**Recommended: 15-20 email accounts**

### 4. Run Warm-up

Accounts start in "warming" status. The system automatically progresses them:
- Day 1-2: 5-10 emails/day
- Day 3-4: 15-20 emails/day
- Day 5-7: 25-35 emails/day
- Day 8-10: 40-50 emails/day
- Day 11+: 50 emails/day (full capacity)

### 5. Scrape Leads

```bash
python -m outreach.cli scrape \
  --location "Atlanta, GA" \
  --category "plumbers" \
  --radius 25
```

### 6. Enrich Contacts

```bash
python -m outreach.cli enrich --limit 500
```

### 7. Create Sequences

```bash
python -m outreach.cli create-sequences --limit 1000
```

### 8. Start Sending

Terminal 1 - Scheduler:
```bash
python -m outreach.cli start-scheduler
```

Terminal 2 - Reply Monitor:
```bash
python -m outreach.cli start-reply-monitor
```

## Email Best Practices (Instantly.ai Benchmarks)

### Subject Lines (Keep Under 40 Characters)
- "Quick question about {{ business_name }}"
- "Idea for {{ business_name }}"
- "5 minutes this week?"
- "{{ city }} {{ category }} question"

### Email Body (50-80 Words)
- **Problem-first**: Lead with the pain point
- **Single CTA**: One clear ask
- **Personalized**: Use business name, city, category
- **Short**: Mobile-friendly
- **Unsubscribe**: Always include opt-out

### Example Template:
```
Hi {{ first_name }},

I came across {{ business_name }} and noticed you're in the {{ category }} space in {{ city }}.

Quick question: Are you currently looking to get more local customers?

We help {{ category }} businesses add 10-15 new clients per month without spending on ads.

Worth a brief conversation?

Best,
Connor

---
Reply "unsubscribe" to opt out.
```

## Daily Operations

### Check Health
```bash
python -m outreach.cli check-health
```

### Check Warm-up Progress
```bash
python -m outreach.cli check-warmup
```

### View Stats
```bash
python -m outreach.cli stats
```

### Export Cold Call List
```bash
python -m outreach.cli export-calls \
  --min-emails 2 \
  --output calls_$(date +%Y%m%d).csv
```

## A/B Testing

Default variants are created on setup. The system automatically:
1. Rotates through variants
2. Tracks opens, clicks, replies
3. Determines winners after 100+ samples
4. Uses winners 70% of the time

View results:
```bash
curl http://localhost:8000/ab-tests
```

## API Endpoints

Start API server:
```bash
python -m outreach.api.server
```

Endpoints:
- `GET /` - Health check
- `GET /businesses` - List businesses
- `GET /businesses/{id}` - Get business details
- `GET /email-accounts` - List email accounts
- `GET /health` - Account health status
- `GET /warmup` - Warm-up status
- `GET /stats` - System statistics
- `GET /ab-tests` - A/B test results
- `POST /businesses/{id}/pause` - Pause outreach

## Database Schema

### Key Tables
- `businesses` - Scraped business data
- `email_accounts` - Sending accounts
- `sequences` - Outreach sequences
- `emails_sent` - Email log
- `ab_test_variants` - A/B test variants
- `unsubscribes` - Opt-out list

## Monitoring

### Reply Detection
- Checks all inboxes every 15 minutes
- Auto-pauses sequences on reply
- Detects positive/negative sentiment
- Auto-processes unsubscribes

### Health Monitoring
- Tracks bounce rates
- Monitors spam complaints
- Auto-pauses unhealthy accounts
- Daily limit enforcement

### Alerts
Set up alerts for:
- Bounce rate > 5%
- Spam complaints
- Account suspension
- Reply rate changes

## Compliance

### CAN-SPAM Requirements
✅ Accurate From name
✅ Valid physical address (in signature)
✅ Clear subject lines
✅ One-click unsubscribe
✅ Honor opt-outs within 10 days

### Best Practices
- Never use deceptive subject lines
- Always include opt-out mechanism
- Maintain suppression list
- Monitor complaint rates
- Keep emails relevant

## Troubleshooting

### Emails Not Sending
1. Check account health: `check-health`
2. Verify warm-up status: `check-warmup`
3. Check daily limits
4. Verify SMTP settings

### Low Reply Rates
1. Review A/B test results
2. Check email copy length
3. Verify personalization
4. Review targeting

### High Bounce Rate
1. Pause affected accounts
2. Review enrichment quality
3. Verify email validation
4. Check for typos

## Support

For issues or questions, contact:
- Perry @ Luzran
- System logs in `system_logs` table
