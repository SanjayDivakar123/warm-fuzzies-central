"""Configuration management."""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/connor_outreach",
        alias="DATABASE_URL"
    )
    
    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        alias="REDIS_URL"
    )
    
    # Email Settings
    default_from_name: str = Field(default="Connor Smith")
    reply_to_email: Optional[str] = Field(default=None)
    
    # Warm-up Settings (14-day progression: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 50, 50, 50, 50)
    warmup_schedule: List[int] = Field(default=[
        5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 50, 50, 50, 50
    ])
    max_daily_emails_per_account: int = Field(default=50)
    
    # Sequence Settings
    sequence_steps: int = Field(default=5)
    sequence_delays_days: List[int] = Field(default=[0, 3, 7, 7, 7])
    # Step 1: Day 0, Step 2: Day 3, Step 3: Day 7, Step 4: Day 7, Step 5: Day 7
    
    # A/B Testing
    ab_test_min_samples: int = Field(default=100)  # Min emails before picking winner
    ab_test_confidence: float = Field(default=0.95)
    
    # Scraping
    gmb_results_per_search: int = Field(default=100)
    scraping_delay_min_seconds: float = Field(default=2.0)
    scraping_delay_max_seconds: float = Field(default=4.0)
    scraping_max_retries: int = Field(default=3)
    scraping_headless: bool = Field(default=True)
    
    # Enrichment
    enrichment_max_attempts: int = Field(default=3)
    enrichment_timeout_seconds: int = Field(default=30)
    
    # Monitoring
    health_check_interval_minutes: int = Field(default=60)
    reply_check_interval_minutes: int = Field(default=15)
    
    # Export
    cold_call_export_format: str = Field(default="csv")  # csv, xlsx
    
# Global settings instance
settings = Settings()
