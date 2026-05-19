#!/bin/bash

# ============================================
# ChainRank Backend - WSL Startup Script
# ============================================

cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend

echo "============================================"
echo "  🚀 Starting ChainRank Backend (WSL)"
echo "============================================"
echo ""
echo "📍 Working Directory: $(pwd)"
echo "🌐 API URL: http://localhost:3000"
echo "📚 API Docs: http://localhost:3000/api-docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
npm start
