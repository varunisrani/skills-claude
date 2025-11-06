"""Post service with business logic."""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.post_repository import post_repository
from app.schemas.post import PostCreate, PostUpdate
from app.models.post import Post


class PostService:
    """Business logic for posts."""

    def __init__(self):
        """Initialize post service."""
        self.repository = post_repository

    async def create_post(
        self,
        db: AsyncSession,
        post_in: PostCreate,
        author_id: int
    ) -> Post:
        """
        Create new post.

        Args:
            db: Database session
            post_in: Post creation schema
            author_id: ID of the post author

        Returns:
            Post: Created post
        """
        # Create post manually to include author_id
        post = Post(
            title=post_in.title,
            content=post_in.content,
            published=post_in.published,
            author_id=author_id
        )
        db.add(post)
        await db.flush()
        await db.refresh(post)
        return post

    async def update_post(
        self,
        db: AsyncSession,
        post_id: int,
        post_in: PostUpdate,
        author_id: int
    ) -> Optional[Post]:
        """
        Update post.

        Args:
            db: Database session
            post_id: Post ID
            post_in: Post update schema
            author_id: ID of the user updating (for authorization)

        Returns:
            Optional[Post]: Updated post if found and authorized

        Raises:
            ValueError: If user is not authorized to update post
        """
        post = await self.repository.get(db, post_id)
        if not post:
            return None

        # Check if user is authorized to update
        if post.author_id != author_id:
            raise ValueError("Not authorized to update this post")

        # Update post
        return await self.repository.update(db, post, post_in)

    async def delete_post(
        self,
        db: AsyncSession,
        post_id: int,
        author_id: int
    ) -> bool:
        """
        Delete post.

        Args:
            db: Database session
            post_id: Post ID
            author_id: ID of the user deleting (for authorization)

        Returns:
            bool: True if deleted

        Raises:
            ValueError: If user is not authorized to delete post
        """
        post = await self.repository.get(db, post_id)
        if not post:
            return False

        # Check if user is authorized to delete
        if post.author_id != author_id:
            raise ValueError("Not authorized to delete this post")

        return await self.repository.delete(db, post_id)

    async def get_user_posts(
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
            author_id: Author ID
            skip: Number to skip
            limit: Maximum number to return

        Returns:
            List[Post]: List of posts
        """
        return await self.repository.get_by_author(db, author_id, skip, limit)

    async def get_published_posts(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[Post]:
        """
        Get all published posts.

        Args:
            db: Database session
            skip: Number to skip
            limit: Maximum number to return

        Returns:
            List[Post]: List of published posts
        """
        return await self.repository.get_published(db, skip, limit)


# Create singleton instance
post_service = PostService()
