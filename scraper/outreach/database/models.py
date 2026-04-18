"""Database models for the outreach system."""

from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional, List

from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, Float, 
    ForeignKey, Enum, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class LeadStatus(str, PyEnum):
    NEW = "new"
    ENRICHING = "enriching"
    READY = "ready"
    CONTACTED = "contacted"
    RESPONDED = "responded"
    BOOKED = "booked"
    DECLINED = "declined"
    BOUNCED = "bounced"
    UNSUBSCRIBED = "unsubscribed"
    INVALID = "invalid"


class SequenceStatus(str, PyEnum):
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    REPLIED = "replied"
    BOUNCED = "bounced"
    UNSUBSCRIBED = "unsubscribed"


class EmailAccountStatus(str, PyEnum):
    WARMING = "warming"
    ACTIVE = "active"
    PAUSED = "paused"
    SUSPENDED = "suspended"
    BANNED = "banned"


class Business(Base):
    """Local business scraped from GMB."""
    __tablename__ = "businesses"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    gmb_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Location
    address: Mapped[Optional[str]] = mapped_column(Text)
    city: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), index=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20))
    country: Mapped[Optional[str]] = mapped_column(String(50), default="US")
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    
    # Contact info
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    website: Mapped[Optional[str]] = mapped_column(String(500))
    email: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    
    # Enrichment data
    owner_name: Mapped[Optional[str]] = mapped_column(String(255))
    owner_email: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    owner_phone: Mapped[Optional[str]] = mapped_column(String(50))
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Metadata
    rating: Mapped[Optional[float]] = mapped_column(Float)
    review_count: Mapped[Optional[int]] = mapped_column(Integer)
    hours: Mapped[Optional[dict]] = mapped_column(JSON)
    gmb_url: Mapped[Optional[str]] = mapped_column(Text)
    
    # Status
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus), default=LeadStatus.NEW, index=True
    )
    enrichment_attempts: Mapped[int] = mapped_column(Integer, default=0)
    enrichment_last_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Tracking
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    sequences: Mapped[List["Sequence"]] = relationship(back_populates="business")
    emails_sent: Mapped[List["EmailSent"]] = relationship(back_populates="business")
    website_audit: Mapped[Optional["WebsiteAudit"]] = relationship(back_populates="business")
    
    __table_args__ = (
        Index('idx_business_status_category', 'status', 'category'),
        Index('idx_business_location', 'city', 'state'),
    )


class EmailAccount(Base):
    """Email account for sending outreach."""
    __tablename__ = "email_accounts"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255))
    
    # SMTP/IMAP settings
    smtp_host: Mapped[str] = mapped_column(String(255))
    smtp_port: Mapped[int] = mapped_column(Integer, default=587)
    smtp_username: Mapped[str] = mapped_column(String(255))
    smtp_password: Mapped[str] = mapped_column(String(255))
    smtp_use_tls: Mapped[bool] = mapped_column(Boolean, default=True)
    
    imap_host: Mapped[Optional[str]] = mapped_column(String(255))
    imap_port: Mapped[int] = mapped_column(Integer, default=993)
    imap_username: Mapped[Optional[str]] = mapped_column(String(255))
    imap_password: Mapped[Optional[str]] = mapped_column(String(255))
    imap_use_ssl: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Status & warm-up
    status: Mapped[EmailAccountStatus] = mapped_column(
        Enum(EmailAccountStatus), default=EmailAccountStatus.WARMING
    )
    warmup_start_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    warmup_day: Mapped[int] = mapped_column(Integer, default=0)
    daily_limit: Mapped[int] = mapped_column(Integer, default=5)
    
    # Health metrics
    emails_sent_today: Mapped[int] = mapped_column(Integer, default=0)
    emails_sent_total: Mapped[int] = mapped_column(Integer, default=0)
    bounce_count: Mapped[int] = mapped_column(Integer, default=0)
    spam_count: Mapped[int] = mapped_column(Integer, default=0)
    last_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    last_check_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Tracking
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    emails_sent: Mapped[List["EmailSent"]] = relationship(back_populates="email_account")
    
    __table_args__ = (
        Index('idx_email_account_status', 'status'),
    )


class Sequence(Base):
    """Email sequence for a lead."""
    __tablename__ = "sequences"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    
    # Sequence config
    name: Mapped[str] = mapped_column(String(100))
    step_count: Mapped[int] = mapped_column(Integer, default=5)
    
    # Status
    status: Mapped[SequenceStatus] = mapped_column(
        Enum(SequenceStatus), default=SequenceStatus.PENDING
    )
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    next_send_at: Mapped[Optional[datetime]] = mapped_column(DateTime, index=True)
    
    # Tracking
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    business: Mapped["Business"] = relationship(back_populates="sequences")
    emails: Mapped[List["EmailSent"]] = relationship(back_populates="sequence")
    
    __table_args__ = (
        Index('idx_sequence_status_next', 'status', 'next_send_at'),
    )


class EmailSent(Base):
    """Record of emails sent."""
    __tablename__ = "emails_sent"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Relationships
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), index=True)
    sequence_id: Mapped[Optional[int]] = mapped_column(ForeignKey("sequences.id"), index=True)
    email_account_id: Mapped[int] = mapped_column(ForeignKey("email_accounts.id"), index=True)
    
    # Email content
    step_number: Mapped[int] = mapped_column(Integer)
    subject: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    
    # A/B testing
    variant_id: Mapped[Optional[str]] = mapped_column(String(50))
    variant_type: Mapped[Optional[str]] = mapped_column(String(20))  # subject, body, cta
    
    # Tracking
    message_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    # Reply tracking
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    reply_content: Mapped[Optional[str]] = mapped_column(Text)
    is_positive_reply: Mapped[Optional[bool]] = mapped_column(Boolean)
    
    # Metrics
    opened_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    clicked_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    bounced_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Relationships
    business: Mapped["Business"] = relationship(back_populates="emails_sent")
    sequence: Mapped[Optional["Sequence"]] = relationship(back_populates="emails")
    email_account: Mapped["EmailAccount"] = relationship(back_populates="emails_sent")
    
    __table_args__ = (
        Index('idx_email_sent_business_step', 'business_id', 'step_number'),
        Index('idx_email_sent_variant', 'variant_id'),
    )


class ABTestVariant(Base):
    """A/B test variant definitions."""
    __tablename__ = "ab_test_variants"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    variant_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    test_type: Mapped[str] = mapped_column(String(20))  # subject, body, cta
    
    # Content
    name: Mapped[str] = mapped_column(String(100))
    content: Mapped[str] = mapped_column(Text)
    
    # Performance
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    open_count: Mapped[int] = mapped_column(Integer, default=0)
    click_count: Mapped[int] = mapped_column(Integer, default=0)
    reply_count: Mapped[int] = mapped_column(Integer, default=0)
    positive_reply_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ScrapingJob(Base):
    """GMB scraping job tracking."""
    __tablename__ = "scraping_jobs"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Search parameters
    location: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(100))
    radius_miles: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), default="running")  # running, completed, failed
    businesses_found: Mapped[int] = mapped_column(Integer, default=0)
    businesses_added: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timing
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    error_message: Mapped[Optional[str]] = mapped_column(Text)


class SystemLog(Base):
    """System activity logging."""
    __tablename__ = "system_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    level: Mapped[str] = mapped_column(String(20), index=True)
    component: Mapped[str] = mapped_column(String(50), index=True)
    message: Mapped[str] = mapped_column(Text)
    details: Mapped[Optional[dict]] = mapped_column(JSON)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )


class Unsubscribe(Base):
    """Unsubscribe tracking."""
    __tablename__ = "unsubscribes"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    business_id: Mapped[Optional[int]] = mapped_column(ForeignKey("businesses.id"))
    source: Mapped[Optional[str]] = mapped_column(String(50))  # email_reply, link_click, manual
    unsubscribed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class WebsiteAudit(Base):
    """Website audit results for a business."""
    __tablename__ = "website_audits"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"), unique=True, index=True)
    
    # Audit metadata
    url: Mapped[str] = mapped_column(String(500))
    audited_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Performance metrics
    load_time_ms: Mapped[Optional[int]] = mapped_column(Integer)
    has_ssl: Mapped[bool] = mapped_column(Boolean, default=False)
    is_mobile_friendly: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Content analysis
    has_contact_form: Mapped[bool] = mapped_column(Boolean, default=False)
    has_clear_cta: Mapped[bool] = mapped_column(Boolean, default=False)
    has_meta_description: Mapped[bool] = mapped_column(Boolean, default=False)
    has_title_tag: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Design analysis
    uses_tables_for_layout: Mapped[bool] = mapped_column(Boolean, default=False)
    has_deprecated_tags: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Link analysis
    total_links: Mapped[int] = mapped_column(Integer, default=0)
    broken_links: Mapped[int] = mapped_column(Integer, default=0)
    broken_link_urls: Mapped[Optional[list]] = mapped_column(JSON)
    
    # Detailed findings
    issues: Mapped[Optional[list]] = mapped_column(JSON)  # List of AuditIssue dicts
    talking_points: Mapped[Optional[list]] = mapped_column(JSON)  # List of strings
    
    # SEO data
    page_title: Mapped[Optional[str]] = mapped_column(String(255))
    meta_description: Mapped[Optional[str]] = mapped_column(Text)
    h1_tags: Mapped[Optional[list]] = mapped_column(JSON)
    
    # Relationships
    business: Mapped["Business"] = relationship(back_populates="website_audit")
    
    __table_args__ = (
        Index('idx_website_audit_business', 'business_id'),
    )
