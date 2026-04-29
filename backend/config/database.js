/**
 * Database Configuration
 * PostgreSQL connection using pg Pool
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_SIZE) || 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  
  // Set default schema untuk hybrid schema
  options: '-c search_path=sk,public',
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on PostgreSQL client:', err);
  process.exit(-1);
});

// Helper function to test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('🕐 Database server time:', result.rows[0].now);
    
    // Test schema accessibility
    const schemaTest = await client.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name = 'sk'
    `);
    
    if (schemaTest.rows.length > 0) {
      console.log('✅ Schema "sk" is accessible');
    } else {
      console.warn('⚠️  Schema "sk" not found. Run: node database/setup-database.js');
    }
    
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection test failed:', err.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
};
