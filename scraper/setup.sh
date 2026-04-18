#!/bin/bash
# Setup script for Connor Smith Outreach System

set -e

echo "Setting up Connor Smith Outreach System..."

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
echo "Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file. Please edit it with your settings."
fi

# Initialize database
echo "Initializing database..."
python -c "import asyncio; from outreach.database import init_database; asyncio.run(init_database())"

# Initialize A/B test variants
echo "Initializing A/B test variants..."
python -c "import asyncio; from outreach.ab_testing.variants import initialize_default_variants; asyncio.run(initialize_default_variants())"

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your database and email settings"
echo "2. Add email accounts using the CLI or API"
echo "3. Start scraping: python -m outreach.cli scrape --location 'Your City' --category 'plumbers'"
echo "4. Run enrichment: python -m outreach.cli enrich"
echo "5. Create sequences: python -m outreach.cli create-sequences"
echo "6. Start scheduler: python -m outreach.cli start-scheduler"
echo "7. Start reply monitor: python -m outreach.cli start-reply-monitor"
