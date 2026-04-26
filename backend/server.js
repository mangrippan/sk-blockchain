/**
 * ChainRank Backend Server
 * Main entry point for the application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS - Allow frontend to access API
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API v1 routes (will be added in next steps)
app.use('/api/v1/auth', require('./routes/v1/auth'));
// app.use('/api/v1/kegiatan', require('./routes/v1/kegiatan'));
// app.use('/api/v1/users', require('./routes/v1/users'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ChainRank API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but server will start anyway');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log(`🚀 ChainRank Backend Server`);
      console.log(`📡 Running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
      console.log('='.repeat(50));
      console.log('');
      console.log('Available endpoints:');
      console.log(`  GET  /health          - Health check`);
      console.log(`  POST /api/v1/auth/login - User login`);
      console.log(`  POST /api/v1/auth/register - User registration`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
