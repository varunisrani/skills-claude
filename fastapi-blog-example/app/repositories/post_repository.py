"""Post repository."""
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.repositories.base_repository import BaseRepository
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate


class PostRepository(BaseRepository[Post, PostCreate, PostUpdate]):
    """Post-specific repository."""

    async def get_by_author(
        self,
        db: AsyncSession,
        author_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Post]:
        """
        Get posts by author.

        Args:
            db: Database session
            author_id: Author user ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List[Post]: List of posts
        """
        result = await db.execute(
            select(Post)
            .where(Post.author_id == author_id)
            .offset(skip)
            .limit(limit)
            .order_by(Post.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_published(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[Post]:
        """
        Get published posts.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List[Post]: List of published posts
        """
        result = await db.execute(
            select(Post)
            .where(Post.published == True)
            .offset(skip)
            .limit(limit)
            .order_by(Post.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_with_author(
        self,
        db: AsyncSession,
        post_id: int
    ) -> Post:
        """
        Get post with author information.

        Args:
            db: Database session
            post_id: Post ID

        Returns:
            Post: Post with author relationship loaded
        """
        result = await db.execute(
            select(Post)
            .options(selectinload(Post.author))
            .where(Post.id == post_id)
        )
        return result.scalars().first()


# Create singleton instance
post_repository = PostRepository(Post)
