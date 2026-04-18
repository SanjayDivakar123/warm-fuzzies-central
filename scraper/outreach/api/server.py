"""
Connor Smith Outreach System - FastAPI Server
Run with: python -m outreach.api.server
"""

import os
import sys
from datetime import datetime
from typing import List, Optional
from contextlib import asynccontextmanager
from hashlib import sha256
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Depends, Header, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database setup - SQLite for local, PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./connor_outreach.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import models
from outreach.database.models import (
    Base, Business, EmailAccount, Sequence, EmailSent,
    ABTestVariant, ScrapingJob, LeadStatus, SequenceStatus, EmailAccountStatus
)


# Authentication
API_KEY = os.getenv("API_KEY", "change-me-in-production")
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Connor Smith Outreach API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Configure for your domains
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Auth dependency
async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    return api_key


# Pydantic Models
class BusinessBase(BaseModel):
    name: str
    category: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None


class BusinessCreate(BusinessBase):
    pass


class BusinessResponse(BusinessBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class EmailAccountBase(BaseModel):
    email: str
    display_name: Optional[str] = None
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    imap_host: Optional[str] = None
    imap_username: Optional[str] = None
    imap_password: Optional[str] = None


class EmailAccountCreate(EmailAccountBase):
    pass


class EmailAccountResponse(EmailAccountBase):
    id: int
    status: str
    daily_limit: int
    emails_sent_today: int
    warmup_day: int
    bounce_count: int

    class Config:
        from_attributes = True


class SequenceCreate(BaseModel):
    business_id: int
    name: str
    step_count: int = 5


class SequenceResponse(BaseModel):
    id: int
    business_id: int
    name: str
    status: str
    current_step: int
    step_count: int
    started_at: Optional[datetime]
    next_send_at: Optional[datetime]

    class Config:
        from_attributes = True


class ScrapingJobCreate(BaseModel):
    location: str
    category: str
    radius_miles: Optional[int] = 25


class ScrapingJobResponse(BaseModel):
    id: int
    location: str
    category: str
    status: str
    businesses_found: int
    businesses_added: int
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_businesses: int
    businesses_by_status: dict
    total_email_accounts: int
    total_emails_sent: int
    total_replies: int
    reply_rate: float
    active_sequences: int


class HealthResponse(BaseModel):
    email: str
    status: str
    daily_limit: int
    sent_today: int
    remaining: int
    bounce_rate: float
    warmup_day: int


class SystemStatus(BaseModel):
    database: str
    database_url: str
    total_businesses: int
    total_sequences: int
    uptime: datetime


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Health Check
@app.get("/health", response_model=SystemStatus)
async def health_check(api_key: str = Depends(verify_api_key)):
    """System health check."""
    with Session(engine) as db:
        business_count = db.query(func.count(Business.id)).scalar()
        seq_count = db.query(func.count(Sequence.id)).scalar()
        
        return SystemStatus(
            database="sqlite" if DATABASE_URL.startswith("sqlite") else "postgresql",
            database_url=DATABASE_URL.replace(":", ":***").rsplit("@", 1)[-1] if "@" in DATABASE_URL else DATABASE_URL,
            total_businesses=business_count,
            total_sequences=seq_count,
            uptime=datetime.utcnow()
        )


# Root
@app.get("/")
async def root(api_key: str = Depends(verify_api_key)):
    return {
        "name": "Connor Smith Outreach API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# ==================== BUSINESSES ====================

@app.get("/businesses", response_model=List[BusinessResponse])
async def list_businesses(
    status: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List all businesses with optional filters."""
    query = db.query(Business)
    
    if status:
        query = query.filter(Business.status == LeadStatus(status))
    if city:
        query = query.filter(Business.city.ilike(f"%{city}%"))
    if category:
        query = query.filter(Business.category.ilike(f"%{category}%"))
    
    businesses = query.offset(offset).limit(limit).all()
    return businesses


@app.get("/businesses/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: int, db: Session = Depends(get_db)):
    """Get a specific business."""
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@app.post("/businesses", response_model=BusinessResponse)
async def create_business(business: BusinessCreate, db: Session = Depends(get_db)):
    """Create a new business."""
    db_business = Business(**business.model_dump())
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    return db_business


@app.post("/businesses/bulk", response_model=List[BusinessResponse])
async def create_businesses(businesses: List[BusinessCreate], db: Session = Depends(get_db)):
    """Create multiple businesses at once."""
    db_businesses = [Business(**b.model_dump()) for b in businesses]
    db.add_all(db_businesses)
    db.commit()
    for b in db_businesses:
        db.refresh(b)
    return db_businesses


@app.patch("/businesses/{business_id}", response_model=BusinessResponse)
async def update_business(business_id: int, updates: dict, db: Session = Depends(get_db)):
    """Update a business."""
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    for key, value in updates.items():
        if hasattr(business, key) and value is not None:
            setattr(business, key, value)
    
    db.commit()
    db.refresh(business)
    return business


@app.patch("/businesses/{business_id}/status")
async def update_business_status(
    business_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Update business status."""
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        business.status = LeadStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    db.commit()
    return {"message": f"Business {business_id} status updated to {status}"}


@app.delete("/businesses/{business_id}")
async def delete_business(business_id: int, db: Session = Depends(get_db)):
    """Delete a business."""
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    db.delete(business)
    db.commit()
    return {"message": f"Business {business_id} deleted"}


# ==================== EMAIL ACCOUNTS ====================

@app.get("/email-accounts", response_model=List[EmailAccountResponse])
async def list_email_accounts(db: Session = Depends(get_db)):
    """List all email accounts."""
    accounts = db.query(EmailAccount).all()
    return accounts


@app.get("/email-accounts/health", response_model=List[HealthResponse])
async def get_email_health(db: Session = Depends(get_db)):
    """Get health status of all email accounts."""
    accounts = db.query(EmailAccount).all()
    
    health = []
    for acc in accounts:
        remaining = max(0, acc.daily_limit - acc.emails_sent_today)
        bounce_rate = (acc.bounce_count / acc.emails_sent_total * 100) if acc.emails_sent_total > 0 else 0
        
        health.append(HealthResponse(
            email=acc.email,
            status=acc.status.value,
            daily_limit=acc.daily_limit,
            sent_today=acc.emails_sent_today,
            remaining=remaining,
            bounce_rate=round(bounce_rate, 2),
            warmup_day=acc.warmup_day
        ))
    
    return health



@app.get("/email-accounts/{account_id}", response_model=EmailAccountResponse)
async def get_email_account(account_id: int, db: Session = Depends(get_db)):
    """Get a specific email account."""
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    return account


@app.post("/email-accounts", response_model=EmailAccountResponse)
async def create_email_account(account: EmailAccountCreate, db: Session = Depends(get_db)):
    """Add a new email account."""
    # Check if email already exists
    existing = db.query(EmailAccount).filter(EmailAccount.email == account.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email account already exists")
    
    db_account = EmailAccount(
        **account.model_dump(),
        status=EmailAccountStatus.WARMING,
        warmup_start_date=datetime.utcnow(),
        warmup_day=0,
        daily_limit=5,
        emails_sent_today=0,
        emails_sent_total=0
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@app.patch("/email-accounts/{account_id}", response_model=EmailAccountResponse)
async def update_email_account(account_id: int, updates: dict, db: Session = Depends(get_db)):
    """Update an email account."""
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    for key, value in updates.items():
        if hasattr(account, key) and value is not None:
            setattr(account, key, value)
    
    db.commit()
    db.refresh(account)
    return account


@app.patch("/email-accounts/{account_id}/status")
async def update_email_account_status(
    account_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Update email account status."""
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    try:
        account.status = EmailAccountStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    db.commit()
    return {"message": f"Email account {account_id} status updated to {status}"}


@app.delete("/email-accounts/{account_id}")
async def delete_email_account(account_id: int, db: Session = Depends(get_db)):
    """Delete an email account."""
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    db.delete(account)
    db.commit()
    return {"message": f"Email account {account_id} deleted"}



# ==================== SEQUENCES ====================

@app.get("/sequences", response_model=List[SequenceResponse])
async def list_sequences(
    status: Optional[str] = None,
    business_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List all sequences."""
    query = db.query(Sequence)
    
    if status:
        query = query.filter(Sequence.status == SequenceStatus(status))
    if business_id:
        query = query.filter(Sequence.business_id == business_id)
    
    sequences = query.all()
    return sequences


@app.get("/sequences/{sequence_id}", response_model=SequenceResponse)
async def get_sequence(sequence_id: int, db: Session = Depends(get_db)):
    """Get a specific sequence."""
    sequence = db.query(Sequence).filter(Sequence.id == sequence_id).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    return sequence


@app.post("/sequences", response_model=SequenceResponse)
async def create_sequence(sequence: SequenceCreate, db: Session = Depends(get_db)):
    """Create a new sequence."""
    # Verify business exists
    business = db.query(Business).filter(Business.id == sequence.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    db_sequence = Sequence(
        **sequence.model_dump(),
        status=SequenceStatus.PENDING,
        current_step=0
    )
    db.add(db_sequence)
    db.commit()
    db.refresh(db_sequence)
    return db_sequence


@app.patch("/sequences/{sequence_id}/status")
async def update_sequence_status(
    sequence_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """Update sequence status."""
    sequence = db.query(Sequence).filter(Sequence.id == sequence_id).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    try:
        sequence.status = SequenceStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    db.commit()
    return {"message": f"Sequence {sequence_id} status updated to {status}"}


@app.post("/sequences/{sequence_id}/pause")
async def pause_sequence(sequence_id: int, db: Session = Depends(get_db)):
    """Pause a sequence."""
    sequence = db.query(Sequence).filter(Sequence.id == sequence_id).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    sequence.status = SequenceStatus.PAUSED
    db.commit()
    return {"message": f"Sequence {sequence_id} paused"}


@app.post("/sequences/{sequence_id}/resume")
async def resume_sequence(sequence_id: int, db: Session = Depends(get_db)):
    """Resume a paused sequence."""
    sequence = db.query(Sequence).filter(Sequence.id == sequence_id).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    sequence.status = SequenceStatus.ACTIVE
    db.commit()
    return {"message": f"Sequence {sequence_id} resumed"}


# ==================== SCRAPING ====================

@app.get("/scraping/jobs", response_model=List[ScrapingJobResponse])
async def list_scraping_jobs(db: Session = Depends(get_db)):
    """List all scraping jobs."""
    jobs = db.query(ScrapingJob).order_by(ScrapingJob.started_at.desc()).all()
    return jobs


@app.post("/scraping/jobs", response_model=ScrapingJobResponse)
async def create_scraping_job(job: ScrapingJobCreate, db: Session = Depends(get_db)):
    """Create a new scraping job."""
    db_job = ScrapingJob(
        **job.model_dump(),
        status="pending"
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@app.get("/scraping/jobs/{job_id}", response_model=ScrapingJobResponse)
async def get_scraping_job(job_id: int, db: Session = Depends(get_db)):
    """Get a specific scraping job."""
    job = db.query(ScrapingJob).filter(ScrapingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Scraping job not found")
    return job


# ==================== STATS ====================

@app.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """Get system statistics."""
    total_businesses = db.query(func.count(Business.id)).scalar()
    
    # Businesses by status
    status_counts = db.query(
        Business.status,
        func.count(Business.id)
    ).group_by(Business.status).all()
    businesses_by_status = {s.value: c for s, c in status_counts}
    
    total_email_accounts = db.query(func.count(EmailAccount.id)).scalar()
    
    total_emails = db.query(func.count(EmailSent.id)).scalar()
    total_replies = db.query(func.count(EmailSent.id)).filter(
        EmailSent.replied_at.isnot(None)
    ).scalar()
    reply_rate = (total_replies / total_emails * 100) if total_emails > 0 else 0
    
    active_sequences = db.query(func.count(Sequence.id)).filter(
        Sequence.status == SequenceStatus.ACTIVE
    ).scalar()
    
    return StatsResponse(
        total_businesses=total_businesses,
        businesses_by_status=businesses_by_status,
        total_email_accounts=total_email_accounts,
        total_emails_sent=total_emails,
        total_replies=total_replies,
        reply_rate=round(reply_rate, 2),
        active_sequences=active_sequences
    )


@app.get("/stats/emails-by-day")
async def get_emails_by_day(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """Get email stats by day."""
    from datetime import timedelta
    start_date = datetime.utcnow() - timedelta(days=days)
    
    emails = db.query(
        func.date(EmailSent.sent_at).label("date"),
        func.count(EmailSent.id).label("sent"),
        func.sum(func.cast(EmailSent.replied_at.isnot(None), Integer)).label("replies")
    ).filter(
        EmailSent.sent_at >= start_date
    ).group_by(
        func.date(EmailSent.sent_at)
    ).all()
    
    return [
        {"date": str(e.date), "sent": e.sent, "replies": e.replies or 0}
        for e in emails
    ]


# ==================== EXPORT ====================

@app.get("/export/businesses/csv")
async def export_businesses_csv(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Export businesses as CSV."""
    query = db.query(Business)
    if status:
        query = query.filter(Business.status == LeadStatus(status))
    
    businesses = query.all()
    
    csv_lines = ["name,category,city,state,phone,email,owner_name,owner_email,status"]
    for b in businesses:
        csv_lines.append(
            f'"{b.name}","{b.category or ""}","{b.city or ""}","{b.state or ""}",'
            f'"{b.phone or ""}","{b.email or ""}","{b.owner_name or ""}",'
            f'"{b.owner_email or ""}","{b.status.value}"'
        )
    
    return {"csv": "\n".join(csv_lines)}


@app.get("/export/cold-call/csv")
async def export_cold_call_csv(db: Session = Depends(get_db)):
    """Export leads ready for cold calling."""
    businesses = db.query(Business).filter(
        Business.phone.isnot(None),
        Business.status == LeadStatus.READY
    ).all()
    
    csv_lines = ["name,phone,address,city,state,owner_name,owner_email"]
    for b in businesses:
        csv_lines.append(
            f'"{b.name}","{b.phone or ""}","{b.address or ""}","{b.city or ""}",'
            f'"{b.state or ""}","{b.owner_name or ""}","{b.owner_email or ""}"'
        )
    
    return {"csv": "\n".join(csv_lines)}


# ==================== SCHEDULER ENDPOINTS ====================

@app.get("/scheduler/next-sends")
async def get_next_sends(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    """Get sequences with upcoming sends."""
    sequences = db.query(Sequence).filter(
        Sequence.status == SequenceStatus.ACTIVE,
        Sequence.next_send_at.isnot(None)
    ).order_by(Sequence.next_send_at).limit(limit).all()
    
    return [
        {
            "id": s.id,
            "business_id": s.business_id,
            "name": s.name,
            "current_step": s.current_step,
            "next_send_at": s.next_send_at
        }
        for s in sequences
    ]


@app.post("/scheduler/process-sends")
async def process_sends(db: Session = Depends(get_db)):
    """Trigger processing of due sequences."""
    now = datetime.utcnow()
    
    sequences = db.query(Sequence).filter(
        Sequence.status == SequenceStatus.ACTIVE,
        Sequence.next_send_at <= now
    ).all()
    
    processed = []
    for seq in sequences:
        # This would call the actual sender in production
        processed.append({
            "sequence_id": seq.id,
            "business_id": seq.business_id,
            "step": seq.current_step
        })
        
        # Advance the sequence
        if seq.current_step < seq.step_count:
            seq.current_step += 1
        else:
            seq.status = SequenceStatus.COMPLETED
    
    db.commit()
    
    return {"processed": len(processed), "sequences": processed}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
