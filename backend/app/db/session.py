from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

# Build engine — no connect_args needed; SSL is embedded in the DATABASE_URL (?sslmode=require)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # Handles Neon autosuspend reconnections transparently
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
