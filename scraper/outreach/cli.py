"""Command-line interface for the outreach system."""

import asyncio
import csv
import json
from datetime import datetime
from typing import Optional

import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn

from outreach.database import init_database, get_db_session
from outreach.database.models import Business, LeadStatus, EmailAccount, Sequence
from outreach.database.queries import BusinessQueries
from outreach.scraper.gmb import GMBScraper
from outreach.scraper.enrichment import EmailEnricher
from outreach.sequencer.sequences import SequenceManager
from outreach.email.rotation import EmailRotationSystem
from outreach.email.warmup import WarmupProtocol
from outreach.ab_testing.variants import initialize_default_variants


console = Console()


@click.group()
def cli():
    """Connor Smith Cold Outreach System"""
    pass


@cli.command()
def init_db():
    """Initialize the database."""
    console.print("[bold blue]Initializing database...[/bold blue]")
    asyncio.run(init_database())
    console.print("[bold green]Database initialized successfully![/bold green]")


@cli.command()
@click.option("--location", required=True, help="Location to search (e.g., 'Atlanta, GA')")
@click.option("--category", required=True, help="Business category (e.g., 'plumbers')")
@click.option("--radius", default=25, help="Search radius in miles")
def scrape(location: str, category: str, radius: int):
    """Scrape Google My Business listings."""
    console.print(f"[bold blue]Scraping {category} in {location}...[/bold blue]")
    
    async def run():
        async with GMBScraper() as scraper:
            result = await scraper.scrape_to_database(location, category, radius)
            
            if result["status"] == "success":
                console.print(f"[bold green]Found: {result['found']} businesses[/bold green]")
                console.print(f"[bold green]Added: {result['added']} new businesses[/bold green]")
            else:
                console.print(f"[bold red]Error: {result.get('error')}[/bold red]")
    
    asyncio.run(run())


@cli.command()
@click.option("--limit", default=100, help="Maximum businesses to enrich")
def enrich(limit: int):
    """Enrich businesses with contact information."""
    console.print(f"[bold blue]Enriching up to {limit} businesses...[/bold blue]")
    
    async def run():
        async with get_db_session() as session:
            # Get businesses needing enrichment
            from sqlalchemy import select
            result = await session.execute(
                select(Business)
                .where(Business.status == LeadStatus.NEW)
                .limit(limit)
            )
            businesses = result.scalars().all()
            
            if not businesses:
                console.print("[yellow]No businesses to enrich[/yellow]")
                return
            
            business_ids = [b.id for b in businesses]
        
        async with EmailEnricher() as enricher:
            result = await enricher.enrich_batch(business_ids)
            
            console.print(f"[bold green]Processed: {result['total']}[/bold green]")
            console.print(f"[bold green]Successful: {result['successful']}[/bold green]")
            console.print(f"[bold red]Failed: {result['failed']}[/bold red]")
    
    asyncio.run(run())


@cli.command()
@click.option("--limit", default=100, help="Maximum sequences to create")
def create_sequences(limit: int):
    """Create outreach sequences for ready businesses."""
    console.print(f"[bold blue]Creating sequences for up to {limit} businesses...[/bold blue]")
    
    async def run():
        async with get_db_session() as session:
            result = await session.execute(
                select(Business)
                .where(Business.status == LeadStatus.READY)
                .limit(limit)
            )
            businesses = result.scalars().all()
            business_ids = [b.id for b in businesses]
        
        manager = SequenceManager()
        result = await manager.create_sequences_for_batch(business_ids)
        
        console.print(f"[bold green]Created: {result['created']}[/bold green]")
        console.print(f"[yellow]Skipped: {result['skipped']}[/yellow]")
        console.print(f"[bold red]Failed: {result['failed']}[/bold red]")
    
    asyncio.run(run())


@cli.command()
def start_scheduler():
    """Start the sequence scheduler."""
    console.print("[bold blue]Starting sequence scheduler...[/bold blue]")
    
    async def run():
        from outreach.sequencer.scheduler import SequenceScheduler
        scheduler = SequenceScheduler()
        await scheduler.run_continuous(interval_seconds=60)
    
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        console.print("[bold yellow]Scheduler stopped[/bold yellow]")


@cli.command()
def start_reply_monitor():
    """Start the reply monitor."""
    console.print("[bold blue]Starting reply monitor...[/bold blue]")
    
    async def run():
        from outreach.email.reply_detector import ReplyMonitor
        monitor = ReplyMonitor()
        await monitor.start()
    
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        console.print("[bold yellow]Monitor stopped[/bold yellow]")


@cli.command()
def check_warmup():
    """Check warm-up status of all accounts."""
    console.print("[bold blue]Checking warm-up status...[/bold blue]")
    
    async def run():
        warmup = WarmupProtocol()
        statuses = await warmup.get_all_warmup_status()
        
        table = Table(title="Email Account Warm-up Status")
        table.add_column("Email", style="cyan")
        table.add_column("Status", style="magenta")
        table.add_column("Day", justify="right")
        table.add_column("Limit", justify="right")
        table.add_column("Progress", style="green")
        
        for status in statuses:
            progress = f"{status.get('progress_percent', 0)}%"
            table.add_row(
                status["email"],
                status["status"],
                str(status.get("day", "-")),
                str(status.get("current_limit", "-")),
                progress
            )
        
        console.print(table)
    
    asyncio.run(run())


@cli.command()
def check_health():
    """Check health of all email accounts."""
    console.print("[bold blue]Checking account health...[/bold blue]")
    
    async def run():
        rotation = EmailRotationSystem()
        health_statuses = await rotation.get_all_health_status()
        
        table = Table(title="Email Account Health")
        table.add_column("Email", style="cyan")
        table.add_column("Status", style="magenta")
        table.add_column("Sent Today", justify="right")
        table.add_column("Remaining", justify="right")
        table.add_column("Bounce Rate", justify="right")
        table.add_column("Score", justify="right")
        table.add_column("Recommendation", style="yellow")
        
        for health in health_statuses:
            bounce_rate = f"{health.bounce_rate*100:.1f}%"
            table.add_row(
                health.email,
                health.status.value,
                str(health.sent_today),
                str(health.remaining),
                bounce_rate,
                f"{health.overall_score:.0f}",
                health.recommendation
            )
        
        console.print(table)
    
    asyncio.run(run())


@cli.command()
@click.option("--min-emails", default=2, help="Minimum emails sent before calling")
@click.option("--output", default="cold_call_list.csv", help="Output file path")
def export_calls(min_emails: int, output: str):
    """Export cold call list."""
    console.print(f"[bold blue]Exporting cold call list to {output}...[/bold blue]")
    
    async def run():
        async with get_db_session() as session:
            businesses = await BusinessQueries.get_for_cold_calling(
                session, min_emails_sent=min_emails, limit=1000
            )
            
            if not businesses:
                console.print("[yellow]No businesses to export[/yellow]")
                return
            
            with open(output, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'Business Name', 'Owner Name', 'Phone', 'Email',
                    'City', 'State', 'Category', 'Website', 'Status'
                ])
                
                for business in businesses:
                    writer.writerow([
                        business.name,
                        business.owner_name or '',
                        business.phone or '',
                        business.owner_phone or business.phone or '',
                        business.city or '',
                        business.state or '',
                        business.category or '',
                        business.website or '',
                        business.status.value
                    ])
            
            console.print(f"[bold green]Exported {len(businesses)} leads to {output}[/bold green]")
    
    asyncio.run(run())


@cli.command()
def stats():
    """Show system statistics."""
    console.print("[bold blue]Gathering statistics...[/bold blue]")
    
    async def run():
        async with get_db_session() as session:
            from sqlalchemy import func, select
            
            # Business stats
            result = await session.execute(
                select(Business.status, func.count(Business.id))
                .group_by(Business.status)
            )
            business_stats = dict(result.all())
            
            # Email account stats
            result = await session.execute(
                select(EmailAccount.status, func.count(EmailAccount.id))
                .group_by(EmailAccount.status)
            )
            account_stats = dict(result.all())
            
            # Sequence stats
            result = await session.execute(
                select(Sequence.status, func.count(Sequence.id))
                .group_by(Sequence.status)
            )
            sequence_stats = dict(result.all())
            
            # Total emails sent
            from outreach.database.models import EmailSent
            result = await session.execute(select(func.count(EmailSent.id)))
            total_emails = result.scalar()
            
            # Replies
            result = await session.execute(
                select(func.count(EmailSent.id))
                .where(EmailSent.replied_at.isnot(None))
            )
            total_replies = result.scalar()
            
            # Positive replies
            result = await session.execute(
                select(func.count(EmailSent.id))
                .where(EmailSent.is_positive_reply == True)
            )
            positive_replies = result.scalar()
        
        # Display stats
        console.print("\n[bold]Businesses:[/bold]")
        for status, count in business_stats.items():
            console.print(f"  {status}: {count}")
        
        console.print("\n[bold]Email Accounts:[/bold]")
        for status, count in account_stats.items():
            console.print(f"  {status}: {count}")
        
        console.print("\n[bold]Sequences:[/bold]")
        for status, count in sequence_stats.items():
            console.print(f"  {status}: {count}")
        
        console.print(f"\n[bold]Emails Sent:[/bold] {total_emails}")
        console.print(f"[bold]Replies:[/bold] {total_replies}")
        console.print(f"[bold]Positive Replies:[/bold] {positive_replies}")
        
        if total_emails > 0:
            reply_rate = (total_replies / total_emails) * 100
            positive_rate = (positive_replies / total_emails) * 100
            console.print(f"[bold]Reply Rate:[/bold] {reply_rate:.1f}%")
            console.print(f"[bold]Positive Reply Rate:[/bold] {positive_rate:.1f}%")
    
    asyncio.run(run())


@cli.command()
def init_ab_tests():
    """Initialize default A/B test variants."""
    console.print("[bold blue]Initializing A/B test variants...[/bold blue]")
    asyncio.run(initialize_default_variants())
    console.print("[bold green]A/B test variants initialized![/bold green]")


if __name__ == "__main__":
    cli()
