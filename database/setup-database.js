/**
 * Database Setup Script
 * Script untuk verify database dan run schema jika belum
 */

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'prima_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function checkSchema() {
  console.log('🔍 Checking if schema "sk" exists...');
  
  try {
    const result = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'sk'
    `);
    
    return result.rows.length > 0;
  } catch (err) {
    console.error('❌ Error checking schema:', err.message);
    return false;
  }
}

async function checkTables() {
  console.log('🔍 Checking if tables exist in schema "sk"...');
  
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'sk'
      ORDER BY table_name
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Found tables in schema "sk":');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      return true;
    } else {
      console.log('⚠️  Schema "sk" exists but no tables found.');
      return false;
    }
  } catch (err) {
    console.error('❌ Error checking tables:', err.message);
    return false;
  }
}

async function runSchema() {
  console.log('📝 Running schema-hybrid.sql...');
  
  try {
    const schemaPath = path.join(__dirname, 'schema-hybrid.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    
    await pool.query(schemaSql);
    
    console.log('✅ Schema executed successfully!');
    return true;
  } catch (err) {
    console.error('❌ Error running schema:', err.message);
    console.error('Full error:', err);
    return false;
  }
}

async function verifySeedData() {
  console.log('🔍 Verifying seed data...');
  
  try {
    // Check users
    const users = await pool.query('SELECT COUNT(*) FROM sk.users');
    console.log(`   - Users: ${users.rows[0].count} records`);
    
    // Check master data
    const kategori = await pool.query('SELECT COUNT(*) FROM sk.ref_kategori_kum');
    console.log(`   - Kategori KUM: ${kategori.rows[0].count} records`);
    
    const kegiatan = await pool.query('SELECT COUNT(*) FROM sk.ref_kegiatan_kum');
    console.log(`   - Kegiatan KUM: ${kegiatan.rows[0].count} records`);
    
    const dokumen = await pool.query('SELECT COUNT(*) FROM sk.ref_jenis_dokumen');
    console.log(`   - Jenis Dokumen: ${dokumen.rows[0].count} records`);
    
    console.log('✅ Seed data verified!');
    return true;
  } catch (err) {
    console.error('❌ Error verifying seed data:', err.message);
    return false;
  }
}

async function testViews() {
  console.log('🔍 Testing views...');
  
  try {
    await pool.query('SELECT * FROM sk.v_kegiatan_summary LIMIT 5');
    console.log('   - v_kegiatan_summary: OK');
    
    await pool.query('SELECT * FROM sk.v_usulan_summary LIMIT 5');
    console.log('   - v_usulan_summary: OK');
    
    console.log('✅ Views are working!');
    return true;
  } catch (err) {
    console.error('❌ Error testing views:', err.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Prima Database Setup');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    const testResult = await pool.query('SELECT NOW()');
    console.log(`✅ Connected to database at: ${testResult.rows[0].now}`);
    console.log();
    
    // Check if schema exists
    const schemaExists = await checkSchema();
    console.log();
    
    if (!schemaExists) {
      console.log('⚠️  Schema "sk" does not exist. Creating...');
      const success = await runSchema();
      if (!success) {
        console.log('❌ Failed to create schema. Exiting...');
        process.exit(1);
      }
      console.log();
    } else {
      console.log('✅ Schema "sk" already exists.');
      console.log();
      
      // Check if tables exist
      const tablesExist = await checkTables();
      console.log();
      
      if (!tablesExist) {
        console.log('⚠️  Tables not found. Running schema...');
        const success = await runSchema();
        if (!success) {
          console.log('❌ Failed to create tables. Exiting...');
          process.exit(1);
        }
        console.log();
      }
    }
    
    // Verify seed data
    await verifySeedData();
    console.log();
    
    // Test views
    await testViews();
    console.log();
    
    console.log('='.repeat(60));
    console.log('✅ Database setup complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('You can now:');
    console.log('1. Start the backend server: cd backend && npm run dev');
    console.log('2. Test the API endpoints');
    console.log('3. Connect from frontend');
    console.log();
    
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
main();
