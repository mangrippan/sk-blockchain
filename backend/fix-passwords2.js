require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  const dosenHash = await bcrypt.hash('dosen123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);
  
  const r1 = await pool.query('UPDATE sk.users SET password_hash = $1 WHERE role IN ($2, $3)', [dosenHash, 'dosen', 'pimpinan']);
  console.log('Updated dosen/pimpinan:', r1.rowCount, 'rows');
  
  const r2 = await pool.query('UPDATE sk.users SET password_hash = $1 WHERE role IN ($2, $3)', [adminHash, 'admin_sdm', 'superadmin']);
  console.log('Updated admin:', r2.rowCount, 'rows');
  
  const users = await pool.query('SELECT email, role FROM sk.users ORDER BY role');
  users.rows.forEach(u => console.log(' ', u.email, '-', u.role));
  
  // Verify
  const testUser = await pool.query('SELECT password_hash FROM sk.users WHERE email = $1', ['budi.santoso@chainrank.test']);
  if (testUser.rows.length > 0) {
    const match = await bcrypt.compare('dosen123', testUser.rows[0].password_hash);
    console.log('\nVerify budi.santoso password:', match ? 'OK' : 'FAIL');
  }
  
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
