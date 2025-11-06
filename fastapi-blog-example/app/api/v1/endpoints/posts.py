"""Post endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.schemas.post import Post, PostCreate, PostUpdate, PostWithAuthor
from app.services.post_service import post_service
from app.api.dependencies import get_current_active_user
from app.models.user import User as UserModel

router = APIRouter()


@router.post("/", response_model=Post, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_in: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Create new post.

    Args:
        post_in: Post creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Post: Created post
    """
    post = await post_service.create_post(db, post_in, current_user.id)
    return post


@router.get("/", response_model=List[Post])
async def read_posts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all published posts.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session

    Returns:
        List[Post]: List of published posts
    """
    posts = await post_service.get_published_posts(db, skip, limit)
    return posts


@router.get("/my-posts", response_model=List[Post])
async def read_my_posts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Get current user's posts.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List[Post]: List of user's posts
    """
    posts = await post_service.get_user_posts(db, current_user.id, skip, limit)
    return posts


@router.get("/{post_id}", response_model=PostWithAuthor)
async def read_post(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get post by ID with author information.

    Args:
        post_id: Post ID
        db: Database session

    Returns:
        PostWithAuthor: Post with author information

    Raises:
        HTTPException: If post not found
    """
    post = await post_service.repository.get_with_author(db, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Only show published posts to non-authors
    if not post.published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    return post


@router.patch("/{post_id}", response_model=Post)
async def update_post(
    post_id: int,
    post_in: PostUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Update post.

    Args:
        post_id: Post ID
        post_in: Post update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Post: Updated post

    Raises:
        HTTPException: If not authorized or post not found
    """
    try:
        post = await post_service.update_post(db, post_id, post_in, current_user.id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        return post
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Delete post.

    Args:
        post_id: Post ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If not authorized or post not found
    """
    try:
        deleted = await post_service.delete_post(db, post_id, current_user.id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
