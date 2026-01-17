# ============================================
# Voara Voice Agent Backend - Production Dockerfile
# ============================================
FROM python:3.11-slim

# Set environment variables for Python and Poetry
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.2 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

# Fix NumPy CPU compatibility for older servers
# This forces NumPy to not use advanced CPU instructions
ENV NPY_DISABLE_CPU_FEATURES="AVX512F AVX512CD AVX512_SKX AVX512_CLX AVX512_CNL AVX512_ICL"

# Add poetry to PATH
ENV PATH="$POETRY_HOME/bin:$PATH"

# Install system dependencies including OpenBLAS for NumPy
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    gfortran \
    libopenblas-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -

# Set work directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Uninstall any pre-built numpy and reinstall from source for CPU compatibility
RUN pip install --no-cache-dir --no-binary numpy "numpy<2.0"

# Install dependencies (no dev dependencies for production)
RUN poetry install --only main --no-root

# Copy application code
COPY . .

# Install the project itself
RUN poetry install --only main

# Expose port
EXPOSE 8000

# Health check with longer startup time for slower servers
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Default command - API server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
