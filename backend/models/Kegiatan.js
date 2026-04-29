/**
 * Kegiatan Model
 * Handles all database operations for kegiatan_dosen table
 */

const { pool } = require('../config/database');

class Kegiatan {
  /**
   * Find kegiatan by ID
   * @param {string} id - Kegiatan UUID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = `
        SELECT k.*, 
               u.nama_lengkap as nama_dosen,
               ref.kode_kegiatan, ref.nama_kegiatan, ref.poin_maksimal,
               kat.nama_kategori,
               v.nama_lengkap as verified_by_name
        FROM sk.kegiatan_dosen k
        JOIN sk.users u ON k.dosen_id = u.id
        JOIN sk.ref_kegiatan_kum ref ON k.ref_kegiatan_id = ref.id
        JOIN sk.ref_kategori_kum kat ON ref.kategori_id = kat.id
        LEFT JOIN sk.users v ON k.verified_by = v.id
        WHERE k.id = $1 AND k.deleted_at IS NULL
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Kegiatan.findById:', error);
      throw error;
    }
  }

  /**
   * Create new kegiatan
   * @param {Object} kegiatanData - Kegiatan data
   * @returns {Promise<Object>}
   */
  static async create(kegiatanData) {
    try {
      const {
        dosen_id,
        ref_kegiatan_id,
        poin_kum,
        deskripsi = null,
        file_name,
        file_path,
        file_hash,
        file_size = null,
        document_url = null,
      } = kegiatanData;

      const query = `
        INSERT INTO sk.kegiatan_dosen (
          dosen_id, ref_kegiatan_id, poin_kum, deskripsi,
          file_name, file_path, file_hash, file_size, document_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        dosen_id,
        ref_kegiatan_id,
        poin_kum,
        deskripsi,
        file_name,
        file_path,
        file_hash,
        file_size,
        document_url,
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Kegiatan.create:', error);
      throw error;
    }
  }

  /**
   * Update kegiatan (for revision)
   * @param {string} id - Kegiatan ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>}
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'deskripsi',
        'poin_kum',
        'file_name',
        'file_path',
        'file_hash',
        'file_size',
        'document_url',
      ];

      const updates = [];
      const values = [];
      let paramCounter = 1;

      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramCounter}`);
          values.push(updateData[key]);
          paramCounter++;
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);

      const query = `
        UPDATE sk.kegiatan_dosen
        SET ${updates.join(', ')}
        WHERE id = $${paramCounter} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Kegiatan.update:', error);
      throw error;
    }
  }

  /**
   * Update blockchain transaction ID
   * @param {string} id - Kegiatan ID
   * @param {string} txId - Fabric transaction ID
   * @returns {Promise<boolean>}
   */
  static async updateBlockchainTx(id, txId) {
    try {
      const query = `
        UPDATE sk.kegiatan_dosen
        SET tx_id_fabric = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      const result = await pool.query(query, [txId, id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in Kegiatan.updateBlockchainTx:', error);
      throw error;
    }
  }

  /**
   * Verify kegiatan (approve)
   * @param {string} id - Kegiatan ID
   * @param {number} verifiedBy - Verifier user ID
   * @returns {Promise<Object|null>}
   */
  static async verify(id, verifiedBy) {
    try {
      const query = `
        UPDATE sk.kegiatan_dosen
        SET status = 'verified',
            verified_by = $1,
            verified_at = CURRENT_TIMESTAMP,
            rejection_reason = NULL,
            catatan_penolakan = NULL
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await pool.query(query, [verifiedBy, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Kegiatan.verify:', error);
      throw error;
    }
  }

  /**
   * Reject kegiatan
   * @param {string} id - Kegiatan ID
   * @param {number} rejectedBy - Rejector user ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object|null>}
   */
  static async reject(id, rejectedBy, reason) {
    try {
      const query = `
        UPDATE sk.kegiatan_dosen
        SET status = 'rejected',
            verified_by = $1,
            verified_at = CURRENT_TIMESTAMP,
            rejection_reason = $2,
            catatan_penolakan = $2
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await pool.query(query, [rejectedBy, reason, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Kegiatan.reject:', error);
      throw error;
    }
  }

  /**
   * Request revision
   * @param {string} id - Kegiatan ID
   * @param {number} reviewerId - Reviewer user ID
   * @param {string} notes - Revision notes
   * @returns {Promise<Object|null>}
   */
  static async requestRevision(id, reviewerId, notes) {
    try {
      const query = `
        UPDATE sk.kegiatan_dosen
        SET status = 'revision_requested',
            verified_by = $1,
            verified_at = CURRENT_TIMESTAMP,
            catatan_penolakan = $2
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await pool.query(query, [reviewerId, notes, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Kegiatan.requestRevision:', error);
      throw error;
    }
  }

  /**
   * Create revision (new version)
   * @param {string} parentId - Parent kegiatan ID
   * @param {Object} kegiatanData - New kegiatan data
   * @returns {Promise<Object>}
   */
  static async createRevision(parentId, kegiatanData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get parent version
      const parentQuery = 'SELECT versi FROM sk.kegiatan_dosen WHERE id = $1';
      const parentResult = await client.query(parentQuery, [parentId]);
      
      if (parentResult.rows.length === 0) {
        throw new Error('Parent kegiatan not found');
      }

      const parentVersion = parentResult.rows[0].versi;

      // Create new version
      const insertQuery = `
        INSERT INTO sk.kegiatan_dosen (
          dosen_id, ref_kegiatan_id, poin_kum, deskripsi,
          file_name, file_path, file_hash, file_size, document_url,
          versi, referensi_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        kegiatanData.dosen_id,
        kegiatanData.ref_kegiatan_id,
        kegiatanData.poin_kum,
        kegiatanData.deskripsi,
        kegiatanData.file_name,
        kegiatanData.file_path,
        kegiatanData.file_hash,
        kegiatanData.file_size,
        kegiatanData.document_url,
        parentVersion + 1,
        parentId,
      ];

      const result = await client.query(insertQuery, values);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in Kegiatan.createRevision:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get kegiatan by dosen
   * @param {number} dosenId - Dosen user ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async getByDosen(dosenId, options = {}) {
    try {
      const {
        status = null,
        page = 1,
        limit = 10,
      } = options;

      const offset = (page - 1) * limit;
      const conditions = ['k.dosen_id = $1', 'k.deleted_at IS NULL'];
      const values = [dosenId];
      let paramCounter = 2;

      if (status) {
        conditions.push(`k.status = $${paramCounter}`);
        values.push(status);
        paramCounter++;
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sk.kegiatan_dosen k
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      values.push(limit, offset);
      const dataQuery = `
        SELECT k.*, 
               ref.kode_kegiatan, ref.nama_kegiatan, ref.poin_maksimal,
               kat.nama_kategori,
               v.nama_lengkap as verified_by_name
        FROM sk.kegiatan_dosen k
        JOIN sk.ref_kegiatan_kum ref ON k.ref_kegiatan_id = ref.id
        JOIN sk.ref_kategori_kum kat ON ref.kategori_id = kat.id
        LEFT JOIN sk.users v ON k.verified_by = v.id
        WHERE ${whereClause}
        ORDER BY k.created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;

      const dataResult = await pool.query(dataQuery, values);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in Kegiatan.getByDosen:', error);
      throw error;
    }
  }

  /**
   * Get all kegiatan (for admin)
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async getAll(options = {}) {
    try {
      const {
        status = null,
        kategori_id = null,
        page = 1,
        limit = 10,
      } = options;

      const offset = (page - 1) * limit;
      const conditions = ['k.deleted_at IS NULL'];
      const values = [];
      let paramCounter = 1;

      if (status) {
        conditions.push(`k.status = $${paramCounter}`);
        values.push(status);
        paramCounter++;
      }

      if (kategori_id) {
        conditions.push(`ref.kategori_id = $${paramCounter}`);
        values.push(kategori_id);
        paramCounter++;
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sk.kegiatan_dosen k
        JOIN sk.ref_kegiatan_kum ref ON k.ref_kegiatan_id = ref.id
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      values.push(limit, offset);
      const dataQuery = `
        SELECT k.*, 
               u.nama_lengkap as nama_dosen,
               ref.kode_kegiatan, ref.nama_kegiatan, ref.poin_maksimal,
               kat.nama_kategori,
               v.nama_lengkap as verified_by_name
        FROM sk.kegiatan_dosen k
        JOIN sk.users u ON k.dosen_id = u.id
        JOIN sk.ref_kegiatan_kum ref ON k.ref_kegiatan_id = ref.id
        JOIN sk.ref_kategori_kum kat ON ref.kategori_id = kat.id
        LEFT JOIN sk.users v ON k.verified_by = v.id
        WHERE ${whereClause}
        ORDER BY k.created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;

      const dataResult = await pool.query(dataQuery, values);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in Kegiatan.getAll:', error);
      throw error;
    }
  }

  /**
   * Get kegiatan history (versions)
   * @param {string} kegiatanId - Kegiatan ID
   * @returns {Promise<Array>}
   */
  static async getHistory(kegiatanId) {
    try {
      const query = `
        WITH RECURSIVE version_tree AS (
          -- Base case: current version
          SELECT * FROM sk.kegiatan_dosen WHERE id = $1
          
          UNION ALL
          
          -- Recursive case: previous versions
          SELECT k.*
          FROM sk.kegiatan_dosen k
          INNER JOIN version_tree vt ON k.id = vt.referensi_id
        )
        SELECT vt.*, 
               u.nama_lengkap as nama_dosen,
               ref.nama_kegiatan,
               v.nama_lengkap as verified_by_name
        FROM version_tree vt
        JOIN sk.users u ON vt.dosen_id = u.id
        JOIN sk.ref_kegiatan_kum ref ON vt.ref_kegiatan_id = ref.id
        LEFT JOIN sk.users v ON vt.verified_by = v.id
        ORDER BY vt.versi DESC
      `;

      const result = await pool.query(query, [kegiatanId]);
      return result.rows;
    } catch (error) {
      console.error('Error in Kegiatan.getHistory:', error);
      throw error;
    }
  }

  /**
   * Soft delete kegiatan
   * @param {string} id - Kegiatan ID
   * @returns {Promise<boolean>}
   */
  static async softDelete(id) {
    try {
      const query = `
        UPDATE sk.kegiatan_dosen
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
      `;

      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in Kegiatan.softDelete:', error);
      throw error;
    }
  }

  /**
   * Verify file hash integrity
   * @param {string} id - Kegiatan ID
   * @param {string} fileHash - File hash to verify
   * @returns {Promise<boolean>}
   */
  static async verifyFileHash(id, fileHash) {
    try {
      const query = `
        SELECT file_hash FROM sk.kegiatan_dosen
        WHERE id = $1 AND deleted_at IS NULL
      `;

      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return false;
      }

      return result.rows[0].file_hash === fileHash;
    } catch (error) {
      console.error('Error in Kegiatan.verifyFileHash:', error);
      throw error;
    }
  }
}

module.exports = Kegiatan;
