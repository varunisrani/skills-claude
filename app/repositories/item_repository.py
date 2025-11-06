"""Item repository for data access operations."""
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.repositories.base_repository import BaseRepository
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate


class ItemRepository(BaseRepository[Item, ItemCreate, ItemUpdate]):
    """Item-specific repository with custom queries."""

    async def get_by_owner(
        self,
        db: AsyncSession,
        owner_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Item]:
        """
        Get all items belonging to a specific owner.

        Args:
            db: Database session
            owner_id: Owner user ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of items
        """
        result = await db.execute(
            select(Item)
            .where(Item.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_active_items(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[Item]:
        """
        Get all active items.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of active items
        """
        result = await db.execute(
            select(Item)
            .where(Item.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


# Create singleton instance
item_repository = ItemRepository(Item)
