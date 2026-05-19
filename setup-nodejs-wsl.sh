#!/bin/bash

# ============================================
# Setup Node.js di WSL untuk Backend
# ============================================

echo "============================================"
echo "  Node.js Setup for WSL"
echo "============================================"
echo ""

# Check if Node.js already installed
if command -v node &> /dev/null; then
    echo "✅ Node.js already installed"
    node --version
    npm --version
    echo ""
    echo "Ready to run backend in WSL!"
    exit 0
fi

echo "📦 Installing Node.js 18.x LTS in WSL..."
echo ""

# Update package list
sudo apt-get update

# Install curl if not present
sudo apt-get install -y curl

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

echo ""
echo "✅ Node.js installed!"
node --version
npm --version

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "You can now run backend in WSL:"
echo "  ./start-backend-wsl.ps1"
echo ""
