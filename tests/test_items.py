"""Tests for item endpoints."""
import pytest


async def get_auth_token(client, email: str, password: str) -> str:
    """Helper to get authentication token."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_create_item(client):
    """Test creating an item."""
    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "itemowner@example.com",
            "password": "password123",
            "full_name": "Item Owner"
        }
    )

    # Get token
    token = await get_auth_token(client, "itemowner@example.com", "password123")

    # Create item
    response = await client.post(
        "/api/v1/items/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Test Item",
            "description": "Test Description"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Item"
    assert data["description"] == "Test Description"
    assert "id" in data
    assert "owner_id" in data


@pytest.mark.asyncio
async def test_read_items(client):
    """Test reading all items for current user."""
    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "reader@example.com",
            "password": "password123",
            "full_name": "Reader User"
        }
    )

    # Get token
    token = await get_auth_token(client, "reader@example.com", "password123")

    # Create items
    await client.post(
        "/api/v1/items/",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Item 1", "description": "Description 1"}
    )
    await client.post(
        "/api/v1/items/",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Item 2", "description": "Description 2"}
    )

    # Read items
    response = await client.get(
        "/api/v1/items/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_update_item(client):
    """Test updating an item."""
    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "updater@example.com",
            "password": "password123",
            "full_name": "Updater User"
        }
    )

    # Get token
    token = await get_auth_token(client, "updater@example.com", "password123")

    # Create item
    create_response = await client.post(
        "/api/v1/items/",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Old Title", "description": "Old Description"}
    )
    item_id = create_response.json()["id"]

    # Update item
    response = await client.patch(
        f"/api/v1/items/{item_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "New Title"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"
    assert data["description"] == "Old Description"


@pytest.mark.asyncio
async def test_delete_item(client):
    """Test deleting an item."""
    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "deleter@example.com",
            "password": "password123",
            "full_name": "Deleter User"
        }
    )

    # Get token
    token = await get_auth_token(client, "deleter@example.com", "password123")

    # Create item
    create_response = await client.post(
        "/api/v1/items/",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "To Delete", "description": "Will be deleted"}
    )
    item_id = create_response.json()["id"]

    # Delete item
    response = await client.delete(
        f"/api/v1/items/{item_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 204

    # Verify deletion
    get_response = await client.get(
        f"/api/v1/items/{item_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_response.status_code == 404
