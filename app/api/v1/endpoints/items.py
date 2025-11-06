"""Item endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.item import Item, ItemCreate, ItemUpdate
from app.schemas.user import User
from app.repositories.item_repository import item_repository
from app.api.dependencies import get_current_active_user


router = APIRouter()


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_in: ItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create new item for current user.

    Args:
        item_in: Item creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created item
    """
    # Manually create item with owner_id
    from app.models.item import Item as ItemModel
    db_item = ItemModel(
        **item_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(db_item)
    await db.flush()
    await db.refresh(db_item)
    return db_item


@router.get("/", response_model=List[Item])
async def read_items(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all items for current user.

    Args:
        skip: Number of items to skip
        limit: Maximum number of items to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of items
    """
    items = await item_repository.get_by_owner(db, current_user.id, skip, limit)
    return items


@router.get("/{item_id}", response_model=Item)
async def read_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get item by ID.

    Args:
        item_id: Item ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Item

    Raises:
        HTTPException: If item not found or not owned by current user
    """
    item = await item_repository.get(db, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this item"
        )
    return item


@router.patch("/{item_id}", response_model=Item)
async def update_item(
    item_id: int,
    item_in: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update item.

    Args:
        item_id: Item ID
        item_in: Item update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated item

    Raises:
        HTTPException: If item not found or not owned by current user
    """
    item = await item_repository.get(db, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this item"
        )

    updated_item = await item_repository.update(db, item, item_in)
    return updated_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete item.

    Args:
        item_id: Item ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If item not found or not owned by current user
    """
    item = await item_repository.get(db, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this item"
        )

    await item_repository.delete(db, item_id)
