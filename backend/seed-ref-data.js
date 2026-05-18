/**
 * Seed Reference Data
 * Run this to populate ref_kategori_kum, ref_kegiatan_kum, and ref_jenis_dokumen
 */

const { pool } = require('./config/database');

async function seedReferenceData() {
  try {
    console.log('🌱 Starting seed process...\n');

    // 1. Seed ref_kategori_kum
    await pool.query(`
      INSERT INTO sk.ref_kategori_kum (kode, nama_kategori, deskripsi) VALUES
      ('PEND', 'Pendidikan & Pengajaran', 'Kegiatan pendidikan dan pengajaran'),
      ('PENEL', 'Penelitian', 'Kegiatan penelitian dan publikasi ilmiah'),
      ('PENGAB', 'Pengabdian Masyarakat', 'Kegiatan pengabdian kepada masyarakat'),
      ('PENUNJ', 'Penunjang', 'Kegiatan penunjang akademik')
      ON CONFLICT (kode) DO NOTHING
    `);
    console.log('✅ ref_kategori_kum seeded');

    // 2. Seed ref_kegiatan_kum
    await pool.query(`
      INSERT INTO sk.ref_kegiatan_kum (kategori_id, kode_kegiatan, nama_kegiatan, poin_maksimal, syarat_dokumen) VALUES
      ((SELECT id FROM sk.ref_kategori_kum WHERE kode = 'PEND'), 'PEND-01', 'Melaksanakan perkuliahan/tutorial dan menguji serta menyelenggarakan pendidikan di laboratorium, praktik keguruan, bengkel/studio/kebun percobaan/teknologi pengajaran dan praktik lapangan (per semester)', 12.50, 'Bukti beban mengajar, SK mengajar'),
      ((SELECT id FROM sk.ref_kategori_kum WHERE kode = 'PEND'), 'PEND-02', 'Membimbing seminar mahasiswa', 1.00, 'SK pembimbing, daftar mahasiswa'),
      ((SELECT id FROM sk.ref_kategori_kum WHERE kode = 'PEND'), 'PEND-03', 'Membimbing Kuliah Kerja Nyata, Praktik Kerja Nyata, Praktik Kerja Lapangan (per semester)', 1.00, 'SK pembimbing KKN/PKL'),
      ((SELECT id FROM sk.ref_kategori_kum WHERE kode = 'PENEL'), 'PENEL-01', 'Menghasilkan karya ilmiah yang dipublikasikan dalam jurnal internasional bereputasi', 40.00, 'Bukti publikasi, sertifikat indeksasi'),
      ((SELECT id FROM sk.ref_kategori_kum WHERE kode = 'PENEL'), 'PENEL-02', 'Menghasilkan karya ilmiah yang dipublikasikan dalam jurnal nasional terakreditasi', 25.00, 'Bukti publikasi, sertifikat akreditasi jurnal'),
      ((SELECT id FROM sk.ref_kategori_kum WHERE kode = 'PENGAB'), 'PENGAB-01', 'Memberi latihan/penyuluhan/penataran/ceramah pada masyarakat', 2.00, 'Surat tugas, dokumentasi kegiatan'),
      ((SELECT id FROM sk.ref_kategori_kum WHERE kode = 'PENGAB'), 'PENGAB-02', 'Membuat/menulis karya pengabdian pada masyarakat yang dipublikasikan', 3.00, 'Bukti publikasi'),
      ((SELECT id FROM sk.ref_kategori_kum WHERE kode = 'PENUNJ'), 'PENUNJ-01', 'Menjadi anggota dalam suatu Panitia/Badan pada Perguruan Tinggi', 2.00, 'SK Panitia/Badan'),
      ((SELECT id FROM sk.ref_kategori_kum WHERE kode = 'PENUNJ'), 'PENUNJ-02', 'Menjadi anggota panitia/badan pada lembaga pemerintah', 3.00, 'SK Panitia')
      ON CONFLICT (kode_kegiatan) DO NOTHING
    `);
    console.log('✅ ref_kegiatan_kum seeded');

    // 3. Seed ref_jenis_dokumen
    await pool.query(`
      INSERT INTO sk.ref_jenis_dokumen (kode, nama, deskripsi, is_required) VALUES
      ('SK_CPNS', 'SK CPNS', 'Surat Keputusan CPNS', true),
      ('SK_PNS', 'SK PNS', 'Surat Keputusan PNS', true),
      ('SK_TERAKHIR', 'SK Jabatan Terakhir', 'Surat Keputusan jabatan fungsional terakhir', true),
      ('IJAZAH', 'Ijazah', 'Ijazah pendidikan terakhir', true),
      ('TRANSKRIP', 'Transkrip Nilai', 'Transkrip nilai pendidikan terakhir', true),
      ('PAK', 'PAK Terakhir', 'Penetapan Angka Kredit terakhir', false),
      ('SERDOS', 'Sertifikat Dosen', 'Sertifikat pendidik/dosen', false),
      ('CV', 'Curriculum Vitae', 'Daftar riwayat hidup', true)
      ON CONFLICT (kode) DO NOTHING
    `);
    console.log('✅ ref_jenis_dokumen seeded');

    // Verify
    console.log('\n📊 Verification:');
    const result1 = await pool.query('SELECT COUNT(*) FROM sk.ref_kategori_kum');
    console.log(`   - ref_kategori_kum: ${result1.rows[0].count} rows`);
    
    const result2 = await pool.query('SELECT COUNT(*) FROM sk.ref_kegiatan_kum');
    console.log(`   - ref_kegiatan_kum: ${result2.rows[0].count} rows`);
    
    const result3 = await pool.query('SELECT COUNT(*) FROM sk.ref_jenis_dokumen');
    console.log(`   - ref_jenis_dokumen: ${result3.rows[0].count} rows`);

    console.log('\n✨ Seed completed successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedReferenceData().catch(err => {
  console.error(err);
  process.exit(1);
});
