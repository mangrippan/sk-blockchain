require('dotenv').config();
const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function fixPasswords() {
  const dosenHash = await bcrypt.hash('dosen123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);
  
  await pool.query('UPDATE sk.users SET password_hash = $1 WHERE role = $2', [dosenHash, 'dosen']);
  await pool.query('UPDATE sk.users SET password_hash = $1 WHERE role = $2', [dosenHash, 'pimpinan']);
  await pool.query('UPDATE sk.users SET password_hash = $1 WHERE role IN ($2, $3)', [adminHash, 'admin_sdm', 'superadmin']);
  
  const users = await pool.query('SELECT email, role FROM sk.users ORDER BY role');
  users.rows.forEach(u => console.log(u.email, '-', u.role));
  
  console.log('\nPasswords updated!');
  console.log('dosen/pimpinan: dosen123');
  console.log('admin/superadmin: admin123');
  
  await pool.end();
}

fixPasswords();
