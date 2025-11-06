"""Post schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PostBase(BaseModel):
    """Base post schema."""

    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    published: bool = False


class PostCreate(PostBase):
    """Schema for creating a post."""

    pass


class PostUpdate(BaseModel):
    """Schema for updating a post."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    published: Optional[bool] = None


class Post(PostBase):
    """Schema for post response."""

    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PostWithAuthor(Post):
    """Schema for post with author information."""

    author: "User"

    class Config:
        from_attributes = True


# Resolve forward references
from app.schemas.user import User

PostWithAuthor.model_rebuild()
