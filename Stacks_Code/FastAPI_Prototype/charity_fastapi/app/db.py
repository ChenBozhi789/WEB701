from sqlmodel import SQLModel, create_engine, Session
import os

# Database connection URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:Password1@localhost:5432/fastapi_stack_db"
)

# Create database engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

def init_db():
    """
    Initialize the database by creating all tables.
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    Provide a database session for CRUD operations.    
    """
    with Session(engine) as session:
        yield session
