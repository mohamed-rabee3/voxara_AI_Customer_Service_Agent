"""
Tests for the Qdrant Service

Run with: poetry run pytest tests/test_qdrant.py -v
These tests use mocked Qdrant clients.
"""

import os
import pytest
from unittest.mock import patch, MagicMock, AsyncMock


@pytest.fixture(autouse=True)
def mock_env():
    """Mock environment variables for testing."""
    env_vars = {
        "GOOGLE_API_KEY": "test-google-key",
        "QDRANT_URL": "https://test.qdrant.io",
        "QDRANT_API_KEY": "test-qdrant-key",
    }
    with patch.dict(os.environ, env_vars):
        yield


class TestQdrantServiceConfig:
    """Tests for Qdrant service configuration."""
    
    def test_collection_name_default(self, mock_env):
        """Test default collection name."""
        from rag.config import get_rag_settings
        
        get_rag_settings.cache_clear()
        settings = get_rag_settings()
        
        assert settings.qdrant_collection_name == "voara_kb"
    
    def test_qdrant_settings_loaded(self, mock_env):
        """Test Qdrant settings are loaded."""
        from rag.config import get_rag_settings
        
        get_rag_settings.cache_clear()
        settings = get_rag_settings()
        
        assert settings.qdrant_url == "https://test.qdrant.io"
        assert settings.qdrant_api_key == "test-qdrant-key"


class TestQdrantService:
    """Tests for QdrantService class."""
    
    def test_service_initialization(self, mock_env):
        """Test QdrantService can be initialized."""
        from rag.qdrant_service import QdrantService
        
        service = QdrantService()
        
        assert service is not None
        assert service._client is None  # Not connected yet
    
    def test_get_qdrant_service_singleton(self, mock_env):
        """Test get_qdrant_service returns singleton."""
        from rag.qdrant_service import get_qdrant_service
        
        service1 = get_qdrant_service()
        service2 = get_qdrant_service()
        
        assert service1 is service2
    
    @pytest.mark.asyncio
    async def test_create_collection_called(self, mock_env):
        """Test create_collection makes correct API call."""
        with patch("rag.qdrant_service.AsyncQdrantClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.collection_exists = AsyncMock(return_value=False)
            mock_client.create_collection = AsyncMock(return_value=True)
            mock_client_class.return_value = mock_client
            
            from rag.qdrant_service import QdrantService
            
            service = QdrantService()
            service._client = mock_client
            
            result = await service.create_collection()
            
            assert result is True
            mock_client.create_collection.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_collection_exists_method(self, mock_env):
        """Test collection_exists method exists."""
        from rag.qdrant_service import QdrantService
        
        service = QdrantService()
        
        # Verify the method exists
        assert hasattr(service, 'collection_exists')
    
    @pytest.mark.asyncio
    async def test_search_vectors(self, mock_env):
        """Test search returns properly formatted results."""
        with patch("rag.qdrant_service.AsyncQdrantClient") as mock_client_class:
            mock_client = AsyncMock()
            
            # Create mock search results
            mock_point = MagicMock()
            mock_point.id = "test-id"
            mock_point.score = 0.95
            mock_point.payload = {"text": "Test content", "source": "test.md"}
            
            mock_response = MagicMock()
            mock_response.points = [mock_point]
            
            mock_client.query_points = AsyncMock(return_value=mock_response)
            mock_client_class.return_value = mock_client
            
            from rag.qdrant_service import QdrantService
            
            service = QdrantService()
            service._client = mock_client
            
            query_vector = [0.1] * 768
            results = await service.search(query_vector, top_k=3)
            
            # Results should be list of dicts
            assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_upsert_vectors(self, mock_env):
        """Test upsert vectors."""
        with patch("rag.qdrant_service.AsyncQdrantClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.upsert = AsyncMock()
            mock_client_class.return_value = mock_client
            
            from rag.qdrant_service import QdrantService
            
            service = QdrantService()
            service._client = mock_client
            
            ids = ["id1", "id2"]
            vectors = [[0.1] * 768, [0.2] * 768]
            payloads = [{"text": "chunk1"}, {"text": "chunk2"}]
            
            result = await service.upsert_vectors(ids, vectors, payloads)
            
            assert result is True
            mock_client.upsert.assert_called_once()


class TestQdrantLifespan:
    """Tests for Qdrant lifespan management."""
    
    @pytest.mark.asyncio
    async def test_close_connection(self, mock_env):
        """Test close connection."""
        with patch("rag.qdrant_service.AsyncQdrantClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.close = AsyncMock()
            mock_client_class.return_value = mock_client
            
            from rag.qdrant_service import QdrantService
            
            service = QdrantService()
            service._client = mock_client
            
            await service.close()
            
            mock_client.close.assert_called_once()
