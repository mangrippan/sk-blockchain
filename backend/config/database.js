/**
 * Database Configuration
 * PostgreSQL connection using pg Pool
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5434, // FORCE 5434 for Docker (avoid conflict with PostgreSQL 15)
  database: process.env.DB_NAME || 'chainrank_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_SIZE) || 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    // In production, provide CA certificate:
    // ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
  } : false,
});

// Set search_path setelah connect
pool.on('connect', (client) => {
  client.query('SET search_path TO sk, public');
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
