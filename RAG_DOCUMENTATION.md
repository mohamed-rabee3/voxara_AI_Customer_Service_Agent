# RAG (Retrieval-Augmented Generation) Documentation

This document explains how the RAG system is implemented in the Voara Voice Agent, enabling context-aware responses grounded in a knowledge base.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RAG Pipeline Flow                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │  Knowledge  │───▶│   Chunker   │───▶│  Embeddings │───▶│  Qdrant  │ │
│  │    Base     │    │ (Markdown)  │    │ (text-004)  │    │  Cloud   │ │
│  │  (.md file) │    │             │    │             │    │          │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘ │
│                                                                  │       │
│                          INGESTION PHASE                         │       │
├──────────────────────────────────────────────────────────────────┼───────┤
│                                                                  │       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │       │
│  │    User     │───▶│   Query     │───▶│   Vector    │◀─────────┘       │
│  │   Speech    │    │  Embedding  │    │   Search    │                  │
│  └─────────────┘    └─────────────┘    └──────┬──────┘                  │
│                                               │                          │
│                                               ▼                          │
│                                        ┌─────────────┐                  │
│                                        │  Retrieved  │                  │
│                                        │   Context   │                  │
│                                        └──────┬──────┘                  │
│                                               │                          │
│                                               ▼                          │
│                                        ┌─────────────┐                  │
│                                        │ Gemini Live │                  │
│                                        │    API      │                  │
│                                        └──────┬──────┘                  │
│                                               │                          │
│                                               ▼                          │
│                                        ┌─────────────┐                  │
│                                        │   Voice     │                  │
│                                        │  Response   │                  │
│                                        └─────────────┘                  │
│                                                                          │
│                          RETRIEVAL PHASE                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Document Chunker (`rag/chunker.py`)

The `MarkdownChunker` class splits knowledge base documents into semantic chunks optimized for retrieval.

**Key Features:**
- **Markdown-aware splitting**: Respects section boundaries (headers)
- **Configurable chunk size**: Default 500 characters
- **Overlap handling**: 50-character overlap for context continuity
- **Small chunk merging**: Prevents fragments smaller than 50 characters

**Configuration:**
```python
chunk_size: int = 500     # Maximum characters per chunk
chunk_overlap: int = 50   # Overlap between consecutive chunks
min_chunk_size: int = 50  # Minimum chunk size before merging
```

**Example:**
```python
from rag.chunker import MarkdownChunker

chunker = MarkdownChunker(chunk_size=500, chunk_overlap=50)
chunks = chunker.chunk_document(markdown_text, source="faq.md")

# Each chunk contains:
# - id: Unique identifier
# - text: The chunk content
# - metadata: {source, header, level}
```

---

### 2. Embedding Service (`rag/embeddings.py`)

Uses Google's `text-embedding-004` model to convert text into 768-dimensional vectors.

**Key Features:**
- **Asymmetric embeddings**: Uses `retrieval_query` for queries and `retrieval_document` for documents
- **Async support**: Non-blocking embedding generation
- **Batch processing**: Efficient bulk embedding with configurable batch size

**Usage:**
```python
from rag.embeddings import embed_query, embed_document

# For user queries
query_vector = await embed_query("What are your pricing plans?")

# For document chunks (during ingestion)
doc_vector = await embed_document("Voara offers three plans: Starter, Pro...")
```

---

### 3. Vector Database (`rag/qdrant_service.py`)

Manages vector storage and similarity search using **Qdrant Cloud**.

**Key Features:**
- **Cosine similarity**: For semantic matching
- **Score threshold**: Filters low-relevance results (default: 0.3)
- **Async operations**: Non-blocking database calls
- **Singleton pattern**: Efficient connection management

**Configuration:**
```python
qdrant_url: str           # Qdrant Cloud endpoint
qdrant_api_key: str       # API key for authentication
qdrant_collection_name: str = "voara_kb"  # Collection name
```

---

### 4. Retriever (`rag/retriever.py`)

High-level interface combining embeddings and vector search.

**Key Features:**
- **Context formatting**: Prepares retrieved chunks for LLM consumption
- **Source tracking**: Returns metadata for UI display
- **Configurable top-k**: Number of chunks to retrieve (default: 3)

**Usage:**
```python
from rag.retriever import Retriever

retriever = Retriever(top_k=3, score_threshold=0.3)

# Get formatted context for LLM
context = await retriever.retrieve_context(
    query="What plans do you offer?",
    include_metadata=False
)

# Get context with sources (for UI)
context, sources = await retriever.retrieve_with_sources(query)
```

---

### 5. Function Tool Integration (`agent/tools.py`)

The RAG system integrates with Gemini Live API through **function calling**.

**How it works:**
1. User asks a question via voice
2. Gemini Live API recognizes the need for knowledge retrieval
3. It calls the `search_knowledge_base` function tool
4. The tool retrieves relevant context from Qdrant
5. Gemini uses the context to generate an accurate response

**Function Tool Definition:**
```python
@function_tool(
    name="search_knowledge_base",
    description=(
        "Search the Voara AI company knowledge base to find accurate information. "
        "ALWAYS use this tool when the customer asks about: "
        "- Company information, services, or products "
        "- Pricing, plans, or packages "
        "- Features or capabilities "
        "- FAQs or common questions..."
    )
)
async def search_knowledge_base(
    context: RunContext,
    query: str,
) -> str:
    retriever = await _get_retriever()
    result = await retriever.retrieve_context(query=query)
    return result
```

---

## Knowledge Base

### Location
```
rag_data/voxara_info_and_faq.md
```

### Format
The knowledge base uses Markdown format with section headers:

```markdown
# About Voara AI

Voara AI is a cutting-edge voice AI platform...

---

## FAQ

### What services do you offer?
We offer voice-enabled AI assistants for customer service...

### What are your pricing plans?
- **Starter**: $29/month - Up to 1,000 voice minutes
- **Pro**: $99/month - Up to 5,000 voice minutes
- **Enterprise**: Custom pricing
```

---

## Ingestion Process

To ingest the knowledge base into Qdrant:

```bash
cd backend
poetry run python scripts/ingest_knowledge.py
```

**What happens:**
1. Reads `rag_data/voxara_info_and_faq.md`
2. Chunks the document using `MarkdownChunker`
3. Generates embeddings for each chunk
4. Stores vectors in Qdrant Cloud

---

## Example: RAG in Action

### User Question (Voice)
> "What pricing plans do you have?"

### RAG Process

1. **Query Embedding**: 
   ```
   "What pricing plans do you have?" → [0.023, -0.156, 0.089, ...]
   ```

2. **Vector Search** (Qdrant):
   ```
   Top 3 similar chunks retrieved with scores > 0.3
   ```

3. **Retrieved Context**:
   ```
   ## Pricing Plans
   
   - Starter: $29/month - Up to 1,000 voice minutes
   - Pro: $99/month - Up to 5,000 voice minutes
   - Enterprise: Custom pricing for large organizations
   ```

4. **Gemini Response** (Voice):
   > "We have three pricing plans. Our Starter plan is $29 per month 
   > with up to 1,000 voice minutes. The Pro plan is $99 per month 
   > with 5,000 minutes. And for larger organizations, we offer 
   > custom Enterprise pricing."

---

## Configuration Reference

All RAG settings are in `rag/config.py`:

| Setting | Default | Description |
|---------|---------|-------------|
| `chunk_size` | 500 | Maximum chunk size in characters |
| `chunk_overlap` | 50 | Overlap between chunks |
| `embedding_model` | `text-embedding-004` | Google embedding model |
| `embedding_dimension` | 768 | Vector dimension |
| `top_k` | 3 | Number of chunks to retrieve |
| `score_threshold` | 0.3 | Minimum similarity score |
| `qdrant_collection_name` | `voara_kb` | Qdrant collection name |

---

## API Endpoints

### Query RAG (Testing)
```http
POST /api/rag/query
Content-Type: application/json

{
  "query": "What services do you offer?",
  "top_k": 3
}
```

### Get RAG Stats
```http
GET /api/rag/stats
```

### Get Latest RAG Context (Frontend)
```http
GET /api/rag/context
```
Returns the most recently retrieved context for UI display.

---

## Frontend Integration

The frontend displays RAG context in real-time:

1. **Context Panel**: Shows what knowledge the AI is using
2. **Auto-refresh**: Polls `/api/rag/context` for updates
3. **Visual feedback**: Displays source chunks and relevance

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No results returned | Check `score_threshold` - may be too high |
| Slow retrieval | Verify Qdrant Cloud connection |
| Missing context | Re-run ingestion script |
| Outdated knowledge | Update `rag_data/` and re-ingest |

---

## Summary

The Voara RAG system provides:

✅ **Semantic search** using Google embeddings  
✅ **Markdown-aware chunking** for structured documents  
✅ **Real-time retrieval** during voice conversations  
✅ **Function tool integration** with Gemini Live API  
✅ **UI visibility** of retrieved context  

This enables the voice agent to provide accurate, grounded responses based on your company's knowledge base.
