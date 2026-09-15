from __future__ import annotations

import time
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime, Integer, String, create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


class LeadORM(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    position = Column(String, nullable=True)
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    status = Column(String, nullable=False, default="extracted")
    extraction_quality = Column(String, nullable=False, default="partial")
    source_filename = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


_engine = None
_SessionLocal = None
_db_initialized = False


import sqlite3

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()


def init_db(database_url: Optional[str] = None, max_retries: int = 5) -> None:
    global _engine, _SessionLocal, _db_initialized
    from app.core.config import get_settings

    url = database_url or get_settings().DATABASE_URL
    is_sqlite = "sqlite" in url.lower()

    connect_args = {"check_same_thread": False} if is_sqlite else {}
    pool_kwargs = {}

    if not is_sqlite:
        pool_kwargs = {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_timeout": 30,
            "pool_recycle": 300,
            "pool_pre_ping": True,
        }

    for attempt in range(1, max_retries + 1):
        try:
            _engine = create_engine(
                url,
                connect_args=connect_args,
                echo=False,
                **pool_kwargs,
            )

            with _engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                conn.commit()

            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
            Base.metadata.create_all(bind=_engine)
            _db_initialized = True
            logger.info("Database connected successfully (attempt %d)", attempt)
            return

        except Exception as exc:
            logger.warning(
                "Database connection attempt %d/%d failed: %s",
                attempt,
                max_retries,
                str(exc),
            )
            if _engine:
                _engine.dispose()
                _engine = None
            if attempt < max_retries:
                wait_time = min(2 ** attempt, 10)
                logger.info("Retrying in %d seconds...", wait_time)
                time.sleep(wait_time)
            else:
                logger.error("Failed to connect to database after %d attempts", max_retries)
                raise


def check_db_health() -> dict:
    global _engine, _db_initialized
    if _engine is None or not _db_initialized:
        return {"status": "disconnected", "error": "Engine not initialized"}
    try:
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        pool_status = _engine.pool.status() if hasattr(_engine.pool, 'status') else "unknown"
        return {"status": "connected", "pool_status": pool_status}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def get_db() -> Session:
    if _SessionLocal is None:
        init_db()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
