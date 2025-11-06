"""Item Pydantic schemas for request/response validation."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ItemBase(BaseModel):
    """Base item schema with common attributes."""
    title: str
    description: Optional[str] = None
    is_active: bool = True


class ItemCreate(ItemBase):
    """Schema for creating a new item."""
    pass


class ItemUpdate(BaseModel):
    """Schema for updating an item."""
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ItemInDB(ItemBase):
    """Schema for item as stored in database."""
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Item(ItemBase):
    """Schema for item in API responses."""
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
