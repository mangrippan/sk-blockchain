/**
 * ChainRank Backend Server
 * Main entry point for the application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { pool, testConnection } = require('./config/database');
const fabricClient = require('./utils/fabricClient');

// ============================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================

const requiredEnvVars = ['DB_HOST', 'DB_PASSWORD', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('   Please check your .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
let server; // Keep reference for graceful shutdown

// ============================================
// SWAGGER CONFIGURATION
// ============================================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChainRank API Documentation',
      version: '1.0.0',
      description: 'Backend API for ChainRank - Blockchain-based Academic Promotion Tracking System',
      contact: {
        name: 'API Support',
        email: 'support@chainrank.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./routes/v1/*.js', './server.js'], // Path to API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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

// Serve static files (uploaded documents)
app.use('/uploads', express.static('uploads'));

// Request logging (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ChainRank API Documentation',
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns server health status and uptime
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected', // Simple status for now
  });
});

// API v1 routes
app.use('/api/v1/auth', require('./routes/v1/auth'));
app.use('/api/v1/ref', require('./routes/v1/ref'));
app.use('/api/v1/kegiatan', require('./routes/v1/kegiatan'));
app.use('/api/v1/usulan', require('./routes/v1/usulan'));
// app.use('/api/v1/users', require('./routes/v1/users')); // TODO: Week 2

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
    
    // Connect to Fabric network (non-blocking)
    if (fabricClient.isFabricEnabled()) {
      await fabricClient.connectGateway();
    } else {
      console.log('ℹ️  Blockchain integration disabled (set FABRIC_ENABLED=true to enable)');
    }
    
    // Start Express server
    server = app.listen(PORT, () => {
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
      console.log(`  GET  /api-docs        - API Documentation (Swagger UI)`);
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
async function gracefulShutdown(signal) {
  console.log(`👋 ${signal} received, shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('📡 HTTP server closed');
    });
  }
  try {
    await fabricClient.disconnectGateway();
    await pool.end();
    console.log('🗄️  Database pool closed');
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server only if this file is run directly (not required as a module)
if (require.main === module) {
  startServer();
}

// Export app for testing
module.exports = app;
