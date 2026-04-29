/**
 * RefKegiatan Model
 * Handles master data for kegiatan and kategori KUM
 */

const { pool } = require('../config/database');

class RefKegiatan {
  /**
   * Get all kategori KUM
   * @param {boolean} activeOnly - Filter active only
   * @returns {Promise<Array>}
   */
  static async getAllKategori(activeOnly = true) {
    try {
      let query = `
        SELECT * FROM sk.ref_kategori_kum
        WHERE 1=1
      `;

      if (activeOnly) {
        query += ' AND is_active = true';
      }

      query += ' ORDER BY kode ASC';

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in RefKegiatan.getAllKategori:', error);
      throw error;
    }
  }

  /**
   * Get kategori by ID
   * @param {number} id - Kategori ID
   * @returns {Promise<Object|null>}
   */
  static async getKategoriById(id) {
    try {
      const query = 'SELECT * FROM sk.ref_kategori_kum WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in RefKegiatan.getKategoriById:', error);
      throw error;
    }
  }

  /**
   * Get all kegiatan KUM
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  static async getAllKegiatan(options = {}) {
    try {
      const { kategori_id = null, activeOnly = true } = options;

      const conditions = [];
      const values = [];
      let paramCounter = 1;

      if (activeOnly) {
        conditions.push('k.is_active = true');
      }

      if (kategori_id) {
        conditions.push(`k.kategori_id = $${paramCounter}`);
        values.push(kategori_id);
        paramCounter++;
      }

      const whereClause = conditions.length > 0 
        ? 'WHERE ' + conditions.join(' AND ')
        : '';

      const query = `
        SELECT k.*, kat.nama_kategori, kat.kode as kode_kategori
        FROM sk.ref_kegiatan_kum k
        JOIN sk.ref_kategori_kum kat ON k.kategori_id = kat.id
        ${whereClause}
        ORDER BY k.kode_kegiatan ASC
      `;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error in RefKegiatan.getAllKegiatan:', error);
      throw error;
    }
  }

  /**
   * Get kegiatan by ID
   * @param {number} id - Kegiatan ID
   * @returns {Promise<Object|null>}
   */
  static async getKegiatanById(id) {
    try {
      const query = `
        SELECT k.*, kat.nama_kategori
        FROM sk.ref_kegiatan_kum k
        JOIN sk.ref_kategori_kum kat ON k.kategori_id = kat.id
        WHERE k.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in RefKegiatan.getKegiatanById:', error);
      throw error;
    }
  }

  /**
   * Get kegiatan by kode
   * @param {string} kode - Kode kegiatan
   * @returns {Promise<Object|null>}
   */
  static async getKegiatanByKode(kode) {
    try {
      const query = `
        SELECT k.*, kat.nama_kategori
        FROM sk.ref_kegiatan_kum k
        JOIN sk.ref_kategori_kum kat ON k.kategori_id = kat.id
        WHERE k.kode_kegiatan = $1
      `;
      
      const result = await pool.query(query, [kode]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in RefKegiatan.getKegiatanByKode:', error);
      throw error;
    }
  }

  /**
   * Get all jenis dokumen
   * @param {boolean} activeOnly - Filter active only
   * @returns {Promise<Array>}
   */
  static async getAllJenisDokumen(activeOnly = true) {
    try {
      let query = 'SELECT * FROM sk.ref_jenis_dokumen WHERE 1=1';

      if (activeOnly) {
        query += ' AND is_active = true';
      }

      query += ' ORDER BY is_required DESC, nama ASC';

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in RefKegiatan.getAllJenisDokumen:', error);
      throw error;
    }
  }

  /**
   * Get jenis dokumen by ID
   * @param {number} id - Jenis dokumen ID
   * @returns {Promise<Object|null>}
   */
  static async getJenisDokumenById(id) {
    try {
      const query = 'SELECT * FROM sk.ref_jenis_dokumen WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in RefKegiatan.getJenisDokumenById:', error);
      throw error;
    }
  }
}

module.exports = RefKegiatan;
