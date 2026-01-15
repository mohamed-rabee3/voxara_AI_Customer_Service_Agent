# Voara AI Voice Agent

A real-time voice AI customer service assistant powered by **Gemini Live API**, **LiveKit**, and **RAG (Retrieval-Augmented Generation)**.

![Voara AI](https://img.shields.io/badge/Powered%20by-Gemini%20Live%20API-blue)
![LiveKit](https://img.shields.io/badge/Voice-LiveKit-green)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)

## 🚀 Features

- **Real-time Voice Conversations**: Natural voice interactions powered by Gemini Live API
- **RAG-Enhanced Responses**: Answers grounded in your knowledge base
- **Bilingual Support**: English and Arabic with RTL support
- **Beautiful UI**: Animated magic sphere with dark mode support
- **Live Transcripts**: Real-time conversation display
- **Context Visibility**: See what knowledge the AI is using

## 📋 Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │ Magic Sphere │  │  Transcript  │  │   Context Panel     │ │
│   │  (animated)  │  │    Panel     │  │   (RAG context)     │ │
│   └──────────────┘  └──────────────┘  └──────────────────────┘ │
└───────────────────────────┬────────────────────────────────────┘
                            │ WebSocket (LiveKit)
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                     LiveKit Cloud                               │
│              (Real-time audio streaming)                        │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                   Voice Agent (Python)                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │ Gemini Live  │  │   Silero    │  │    RAG Retriever     │ │
│   │   API        │  │     VAD     │  │   (Qdrant + Gemini)  │ │
│   └──────────────┘  └──────────────┘  └──────────────────────┘ │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                     Backend API (FastAPI)                       │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │Token Endpoint│  │Health Checks │  │   RAG Query API     │ │
│   └──────────────┘  └──────────────┘  └──────────────────────┘ │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                      Qdrant Cloud                               │
│                (Vector database for RAG)                        │
└────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Voice AI | Gemini Live API (gemini-2.0-flash-live-001) |
| Voice Streaming | LiveKit Cloud |
| Voice Detection | Silero VAD |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Framer Motion |
| Backend API | FastAPI, Uvicorn |
| Vector DB | Qdrant Cloud |
| Embeddings | Google text-embedding-004 |

## 📦 Prerequisites

- Python 3.11+
- Node.js 20+
- Poetry (Python package manager)
- npm/pnpm

### Cloud Services Required

1. **LiveKit Cloud** - [Sign up here](https://cloud.livekit.io/)
2. **Google AI Studio** - [Get API key](https://aistudio.google.com/apikey)
3. **Qdrant Cloud** - [Sign up here](https://cloud.qdrant.io/)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd voxara_AI_Customer_Service_Agent
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

#### Backend `.env`:
```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Google AI (Gemini)
GOOGLE_API_KEY=your-google-api-key

# Qdrant Cloud
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
```

#### Frontend `.env`:
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Install Dependencies

```bash
# Backend
cd backend
poetry install

# Frontend
cd ../frontend
npm install
```

### 4. Ingest Knowledge Base

Add your knowledge documents to `rag_data/` and run:

```bash
cd backend
poetry run python scripts/ingest_knowledge.py
```

### 5. Start the Services

**Terminal 1 - Backend API:**
```bash
cd backend
poetry run uvicorn api.main:app --reload --port 8000
```

**Terminal 2 - Voice Agent:**
```bash
cd backend
poetry run python -m agent.main dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Running Tests

```bash
# Backend tests (57 tests)
cd backend
poetry run pytest

# With coverage
poetry run pytest --cov=.

# Specific test file
poetry run pytest tests/test_api.py -v
```

## 📚 API Documentation

Once the backend is running, access the interactive API docs:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/token` | POST | Generate LiveKit access token |
| `/api/health` | GET | Health check with dependency status |
| `/api/health/ready` | GET | Kubernetes readiness probe |
| `/api/rag/query` | POST | Test RAG retrieval |
| `/api/rag/stats` | GET | RAG collection statistics |

## 📁 Project Structure

```
voxara_AI_Customer_Service_Agent/
├── backend/
│   ├── api/              # FastAPI REST API
│   │   ├── routes/       # API endpoints
│   │   └── middleware/   # CORS config
│   ├── agent/            # LiveKit Voice Agent
│   │   ├── main.py       # Entry point
│   │   ├── voice_agent.py # Agent logic
│   │   └── config.py     # Configuration
│   ├── rag/              # RAG Pipeline
│   │   ├── chunker.py    # Document chunking
│   │   ├── embeddings.py # Embedding generation
│   │   ├── retriever.py  # Context retrieval
│   │   └── qdrant_service.py # Vector store
│   ├── scripts/          # Utility scripts
│   └── tests/            # Unit tests
├── frontend/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── voice-agent/  # Voice agent UI
│   └── lib/              # Utilities
└── rag_data/             # Knowledge base documents
```

## 🎨 UI Features

- **Magic Sphere**: Animated orb showing agent state (idle, listening, speaking, thinking)
- **Dark Mode**: System-aware with manual toggle
- **Transcript Panel**: Real-time conversation display
- **Context Panel**: Collapsible RAG context viewer
- **RTL Support**: Automatic Arabic text detection
- **Responsive**: Mobile, tablet, and desktop layouts

## 🔧 Configuration Options

### Agent Configuration (`backend/agent/config.py`)

| Setting | Default | Description |
|---------|---------|-------------|
| `gemini_model` | `gemini-2.0-flash-live-001` | Gemini model for voice |
| `gemini_voice` | `Aoede` | Voice for TTS |
| `temperature` | `0.7` | Response creativity |
| `enable_rag` | `true` | Enable RAG context |
| `rag_top_k` | `3` | Number of chunks to retrieve |

### RAG Configuration (`backend/rag/config.py`)

| Setting | Default | Description |
|---------|---------|-------------|
| `chunk_size` | `500` | Max characters per chunk |
| `chunk_overlap` | `50` | Overlap between chunks |
| `embedding_model` | `text-embedding-004` | Google embedding model |
| `embedding_dimension` | `768` | Vector dimension |

## 🚢 Deployment

### Vercel (Frontend)

```bash
cd frontend
vercel
```

Set environment variables in Vercel dashboard.

### Railway/Render (Backend)

Deploy the FastAPI backend with:

```bash
cd backend
# Start command
poetry run uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

### LiveKit Agent

Deploy the agent to your server or use LiveKit Cloud's agent hosting.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `poetry run pytest`
5. Submit a pull request

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LiveKit](https://livekit.io/) for real-time audio infrastructure
- [Google AI](https://ai.google.dev/) for Gemini Live API
- [Qdrant](https://qdrant.tech/) for vector database
- [shadcn/ui](https://ui.shadcn.com/) for UI components
