# Cold Outreach System - Connor Smith

A complete cold outreach automation system with GMB scraping, email enrichment, rotation, warm-up, sequencing, A/B testing, and reply detection.

## Components

1. **GMB Scraper** - Scrape Google My Business listings
2. **Email/Phone Enrichment** - Find and validate owner contacts
3. **Database** - PostgreSQL with business data, flags, lead status
4. **Email Rotation System** - Multiple inboxes, health monitoring
5. **Warm-up Protocol** - 5→50 emails/day over 2 weeks
6. **Outreach Sequencer** - 4-7 step follow-up sequences
7. **A/B Testing** - Auto-rotate and promote winners
8. **Reply Detection** - Track replies, auto-pause sequences
9. **Cold Call List Export** - Export leads for calling team

## Tech Stack

- Python 3.11+
- PostgreSQL 15+
- AsyncIO for concurrent processing
- SQLAlchemy for ORM
- Celery for task scheduling
- Redis for queue management

## Project Structure

```
outreach/
├── __init__.py
├── config.py              # Configuration management
├── database/
│   ├── __init__.py
│   ├── models.py          # SQLAlchemy models
│   ├── init.py            # Database initialization
│   └── queries.py         # Common queries
├── scraper/
│   ├── __init__.py
│   ├── gmb.py             # Google My Business scraper
│   └── enrichment.py      # Email/phone enrichment
├── email/
│   ├── __init__.py
│   ├── rotation.py        # Email rotation system
│   ├── warmup.py          # Warm-up protocol
│   ├── sender.py          # Email sending logic
│   └── reply_detector.py  # Reply detection
├── sequencer/
│   ├── __init__.py
│   ├── sequences.py       # Sequence definitions
│   └── scheduler.py       # Sequence scheduling
├── ab_testing/
│   ├── __init__.py
│   ├── variants.py        # A/B test variants
│   └── analyzer.py        # Results analyzer
├── api/
│   ├── __init__.py
│   └── server.py          # FastAPI server
└── cli.py                 # Command-line interface
```

## Installation

```bash
cd /home/ubuntu/clients/client-connor-smith
pip install -r requirements.txt
```

## Database Setup

```bash
python -m outreach.database.init
```

## Running

```bash
# Start the scheduler
python -m outreach.scheduler

# Start the worker
python -m outreach.worker

# Run GMB scraper
python -m outreach.scraper.gmb --location "Atlanta, GA" --category "plumbers"

# Export cold call list
python -m outreach.cli export-calls --output calls.csv
```

## License

Proprietary - Connor Smith
