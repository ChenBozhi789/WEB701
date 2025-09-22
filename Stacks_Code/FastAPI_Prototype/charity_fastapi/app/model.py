from datetime import datetime 
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, Column, String, Integer

# Define the database models
class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(sa_column=Column(String, unique=True, index=True, nullable=False))
    password: str = Field(sa_column=Column(String, nullable=False))
    role: str = Field(default="beneficiary", sa_column=Column(String, nullable=False))
    token_balance: int = Field(default=0, sa_column=Column(Integer, nullable=False))
    items: List["Item"] = Relationship(back_populates="owner")

class Item(SQLModel, table=True):
    __tablename__ = "items"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(sa_column=Column(String, nullable=False))
    qty: int = Field(default=0, sa_column=Column(Integer, nullable=False))
    description: str = Field(default="", sa_column=Column(String, nullable=False))
    owner_id: int = Field(foreign_key="users.id", nullable=False)

    owner: Optional[User] = Relationship(back_populates="items")

class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"
    id: Optional[int] = Field(default=None, primary_key=True)
    sender_id: int = Field(foreign_key="users.id")
    receiver_id: int = Field(foreign_key="users.id")
    amount: int = Field(default=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)