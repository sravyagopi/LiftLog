#!/bin/bash
# LiftLog Backend Startup Script

echo "🏋️  LiftLog Backend"
echo "==================="

cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d ".venv" ]; then
  echo "→ Creating virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "→ Installing dependencies..."
pip install -r requirements.txt -q

echo "→ Starting FastAPI server on http://localhost:8000"
echo "→ API docs at http://localhost:8000/docs"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000