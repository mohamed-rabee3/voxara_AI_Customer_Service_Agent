"""
Tests for the Embedding Service

Run with: poetry run pytest tests/test_embeddings.py -v
These tests require GOOGLE_API_KEY to be set for live testing.
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


class TestEmbeddingsConfig:
    """Tests for embedding configuration."""
    
    def test_embedding_settings_loaded(self, mock_env):
        """Test that embedding settings are loaded from config."""
        from rag.config import get_rag_settings
        
        get_rag_settings.cache_clear()
        settings = get_rag_settings()
        
        assert settings.embedding_model == "models/text-embedding-004"
        assert settings.embedding_dimension == 768
    
    def test_embedding_model_name(self, mock_env):
        """Test embedding model name is correct."""
        from rag.config import get_rag_settings
        
        get_rag_settings.cache_clear()
        settings = get_rag_settings()
        
        assert "text-embedding" in settings.embedding_model


class TestEmbedFunctions:
    """Tests for embedding functions."""
    
    def test_embed_text_sync_function_exists(self, mock_env):
        """Test that embed_text_sync function exists."""
        from rag.embeddings import embed_text_sync
        
        assert callable(embed_text_sync)
    
    def test_embed_text_async_function_exists(self, mock_env):
        """Test that embed_text async function exists."""
        from rag.embeddings import embed_text
        
        assert callable(embed_text)
    
    def test_embed_query_function_exists(self, mock_env):
        """Test that embed_query function exists."""
        from rag.embeddings import embed_query
        
        assert callable(embed_query)
    
    def test_embed_document_function_exists(self, mock_env):
        """Test that embed_document function exists."""
        from rag.embeddings import embed_document
        
        assert callable(embed_document)
    
    def test_embed_batch_function_exists(self, mock_env):
        """Test that embed_batch function exists."""
        from rag.embeddings import embed_batch
        
        assert callable(embed_batch)


class TestEmbeddingIntegration:
    """Integration tests for embeddings (requires mocking)."""
    
    @pytest.mark.asyncio
    async def test_embed_text_returns_list(self, mock_env):
        """Test that embed_text returns a list of floats."""
        # Create a mock embedding result
        mock_embedding = [0.1] * 768
        
        with patch("rag.embeddings.embed_text_sync", return_value=mock_embedding):
            from rag.embeddings import embed_text
            result = await embed_text("test query")
            
            assert isinstance(result, list)
            assert len(result) == 768
    
    @pytest.mark.asyncio
    async def test_embed_query_calls_embed_text(self, mock_env):
        """Test that embed_query calls embed_text correctly."""
        mock_embedding = [0.1] * 768
        
        with patch("rag.embeddings.embed_text", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = mock_embedding
            
            from rag.embeddings import embed_query
            result = await embed_query("What is Voara AI?")
            
            # Verify result
            assert result == mock_embedding
    
    @pytest.mark.asyncio
    async def test_embed_document_calls_embed_text(self, mock_env):
        """Test that embed_document calls embed_text correctly."""
        mock_embedding = [0.1] * 768
        
        with patch("rag.embeddings.embed_text", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = mock_embedding
            
            from rag.embeddings import embed_document
            result = await embed_document("Voara AI is a voice assistant company.")
            
            # Verify result
            assert result == mock_embedding
