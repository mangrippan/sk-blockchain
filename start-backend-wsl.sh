#!/bin/bash

# ============================================
# ChainRank Backend Starter (WSL)
# Run backend in WSL for proper Fabric connectivity
# ============================================

cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend

echo "🚀 Starting ChainRank Backend in WSL..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Please edit backend/.env with your configuration"
    echo ""
fi

echo "============================================"
echo "  ChainRank Backend Server (WSL)"
echo "============================================"
echo ""
echo "API: http://localhost:3000"
echo "Swagger: http://localhost:3000/api-docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the server
npm start
