require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  // Check tables
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'sk'");
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

  // Check users
  const users = await pool.query('SELECT email, role, password_hash FROM sk.users');
  console.log('Users count:', users.rows.length);
  
  if (users.rows.length === 0) {
    console.log('No users found! Inserting seed users...');
    const dosenHash = await bcrypt.hash('dosen123', 12);
    const adminHash = await bcrypt.hash('admin123', 12);
    
    const seedUsers = [
      ['198501152010011001', 'Dr. Budi Santoso, M.Kom', 'budi.santoso@prima.test', dosenHash, 'dosen', 'Ilmu Komputer', 'Lektor'],
      ['197803122003121001', 'Prof. Dr. Siti Rahayu, M.Si', 'siti.rahayu@prima.test', dosenHash, 'dosen', 'Matematika', 'Guru Besar'],
      ['198207082006041002', 'Dr. Ahmad Wijaya, M.T', 'ahmad.wijaya@prima.test', dosenHash, 'pimpinan', 'Teknik Informatika', 'Lektor Kepala'],
      ['197512012002121001', 'Dra. Dewi Lestari, M.Hum', 'dewi.lestari@prima.test', adminHash, 'admin_sdm', 'SDM', null],
      ['197001011998031001', 'Admin Super', 'admin@prima.test', adminHash, 'superadmin', null, null],
    ];

    for (const u of seedUsers) {
      await pool.query(
        'INSERT INTO sk.users (nip_nidn, nama_lengkap, email, password_hash, role, department, jabatan_saat_ini) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (email) DO UPDATE SET password_hash = $4',
        u
      );
      console.log('  Inserted:', u[2], '-', u[4]);
    }
  } else {
    // Update existing passwords
    const dosenHash = await bcrypt.hash('dosen123', 12);
    const adminHash = await bcrypt.hash('admin123', 12);
    
    for (const u of users.rows) {
      const hash = ['admin_sdm', 'superadmin'].includes(u.role) ? adminHash : dosenHash;
      await pool.query('UPDATE sk.users SET password_hash = $1 WHERE email = $2', [hash, u.email]);
      console.log('  Updated:', u.email, '-', u.role);
    }
  }

  // Verify login
  const testUser = await pool.query('SELECT password_hash FROM sk.users WHERE email = $1', ['budi.santoso@prima.test']);
  if (testUser.rows.length > 0) {
    const match = await bcrypt.compare('dosen123', testUser.rows[0].password_hash);
    console.log('\nVerify budi.santoso login:', match ? 'OK' : 'FAIL');
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
