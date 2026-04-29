/**
 * Usulan Model
 * Handles all database operations for usulan_kenaikan_pangkat table
 */

const { pool } = require('../config/database');

class Usulan {
  /**
   * Find usulan by ID
   * @param {string} id - Usulan UUID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = `
        SELECT u.*, 
               d.nama_lengkap as nama_dosen,
               d.department,
               p.nama_lengkap as processed_by_name
        FROM sk.usulan_kenaikan_pangkat u
        JOIN sk.users d ON u.dosen_id = d.id
        LEFT JOIN sk.users p ON u.processed_by = p.id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Usulan.findById:', error);
      throw error;
    }
  }

  /**
   * Create new usulan
   * @param {Object} usulanData - Usulan data
   * @returns {Promise<Object>}
   */
  static async create(usulanData) {
    try {
      const {
        dosen_id,
        total_poin_diajukan,
        jabatan_asal = null,
        jabatan_tujuan,
        periode_penilaian_mulai = null,
        periode_penilaian_selesai = null,
      } = usulanData;

      const query = `
        INSERT INTO sk.usulan_kenaikan_pangkat (
          dosen_id, total_poin_diajukan, jabatan_asal, jabatan_tujuan,
          periode_penilaian_mulai, periode_penilaian_selesai
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        dosen_id,
        total_poin_diajukan,
        jabatan_asal,
        jabatan_tujuan,
        periode_penilaian_mulai,
        periode_penilaian_selesai,
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Usulan.create:', error);
      throw error;
    }
  }

  /**
   * Update usulan
   * @param {string} id - Usulan ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>}
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'total_poin_diajukan',
        'jabatan_asal',
        'jabatan_tujuan',
        'periode_penilaian_mulai',
        'periode_penilaian_selesai',
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
        UPDATE sk.usulan_kenaikan_pangkat
        SET ${updates.join(', ')}
        WHERE id = $${paramCounter} AND deleted_at IS NULL AND status = 'draft'
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Usulan.update:', error);
      throw error;
    }
  }

  /**
   * Submit usulan (change status to pending)
   * @param {string} id - Usulan ID
   * @returns {Promise<Object|null>}
   */
  static async submit(id) {
    try {
      const query = `
        UPDATE sk.usulan_kenaikan_pangkat
        SET status = 'pending'
        WHERE id = $1 AND deleted_at IS NULL AND status = 'draft'
        RETURNING *
      `;

      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Usulan.submit:', error);
      throw error;
    }
  }

  /**
   * Process usulan (admin starts processing)
   * @param {string} id - Usulan ID
   * @param {number} processedBy - Admin user ID
   * @returns {Promise<Object|null>}
   */
  static async process(id, processedBy) {
    try {
      const query = `
        UPDATE sk.usulan_kenaikan_pangkat
        SET status = 'diproses',
            processed_by = $1,
            processed_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND deleted_at IS NULL AND status = 'pending'
        RETURNING *
      `;

      const result = await pool.query(query, [processedBy, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Usulan.process:', error);
      throw error;
    }
  }

  /**
   * Issue SK (approve usulan)
   * @param {string} id - Usulan ID
   * @param {Object} skData - SK document data
   * @returns {Promise<Object|null>}
   */
  static async issueSK(id, skData) {
    try {
      const {
        sk_document_url,
        sk_document_hash,
        sk_number,
        sk_date,
        processed_by,
      } = skData;

      const query = `
        UPDATE sk.usulan_kenaikan_pangkat
        SET status = 'sk_issued',
            sk_document_url = $1,
            sk_document_hash = $2,
            sk_number = $3,
            sk_date = $4,
            processed_by = $5,
            processed_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND deleted_at IS NULL AND status = 'diproses'
        RETURNING *
      `;

      const result = await pool.query(query, [
        sk_document_url,
        sk_document_hash,
        sk_number,
        sk_date,
        processed_by,
        id,
      ]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Usulan.issueSK:', error);
      throw error;
    }
  }

  /**
   * Reject usulan
   * @param {string} id - Usulan ID
   * @param {number} rejectedBy - Rejector user ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object|null>}
   */
  static async reject(id, rejectedBy, reason) {
    try {
      const query = `
        UPDATE sk.usulan_kenaikan_pangkat
        SET status = 'rejected',
            processed_by = $1,
            processed_at = CURRENT_TIMESTAMP,
            rejection_reason = $2,
            catatan_penolakan = $2
        WHERE id = $3 AND deleted_at IS NULL 
          AND status IN ('pending', 'diproses')
        RETURNING *
      `;

      const result = await pool.query(query, [rejectedBy, reason, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Usulan.reject:', error);
      throw error;
    }
  }

  /**
   * Request revision
   * @param {string} id - Usulan ID
   * @param {number} reviewerId - Reviewer user ID
   * @param {string} notes - Revision notes
   * @returns {Promise<Object|null>}
   */
  static async requestRevision(id, reviewerId, notes) {
    try {
      const query = `
        UPDATE sk.usulan_kenaikan_pangkat
        SET status = 'revision_requested',
            processed_by = $1,
            processed_at = CURRENT_TIMESTAMP,
            catatan_penolakan = $2
        WHERE id = $3 AND deleted_at IS NULL 
          AND status IN ('pending', 'diproses')
        RETURNING *
      `;

      const result = await pool.query(query, [reviewerId, notes, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in Usulan.requestRevision:', error);
      throw error;
    }
  }

  /**
   * Update blockchain transaction ID
   * @param {string} id - Usulan ID
   * @param {string} txId - Fabric transaction ID
   * @returns {Promise<boolean>}
   */
  static async updateBlockchainTx(id, txId) {
    try {
      const query = `
        UPDATE sk.usulan_kenaikan_pangkat
        SET tx_id_fabric = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      const result = await pool.query(query, [txId, id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in Usulan.updateBlockchainTx:', error);
      throw error;
    }
  }

  /**
   * Get usulan by dosen
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
      const conditions = ['u.dosen_id = $1', 'u.deleted_at IS NULL'];
      const values = [dosenId];
      let paramCounter = 2;

      if (status) {
        conditions.push(`u.status = $${paramCounter}`);
        values.push(status);
        paramCounter++;
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sk.usulan_kenaikan_pangkat u
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      values.push(limit, offset);
      const dataQuery = `
        SELECT u.*, 
               p.nama_lengkap as processed_by_name
        FROM sk.usulan_kenaikan_pangkat u
        LEFT JOIN sk.users p ON u.processed_by = p.id
        WHERE ${whereClause}
        ORDER BY u.created_at DESC
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
      console.error('Error in Usulan.getByDosen:', error);
      throw error;
    }
  }

  /**
   * Get all usulan (for admin)
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async getAll(options = {}) {
    try {
      const {
        status = null,
        page = 1,
        limit = 10,
      } = options;

      const offset = (page - 1) * limit;
      const conditions = ['u.deleted_at IS NULL'];
      const values = [];
      let paramCounter = 1;

      if (status) {
        conditions.push(`u.status = $${paramCounter}`);
        values.push(status);
        paramCounter++;
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sk.usulan_kenaikan_pangkat u
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      values.push(limit, offset);
      const dataQuery = `
        SELECT u.*, 
               d.nama_lengkap as nama_dosen,
               d.department,
               p.nama_lengkap as processed_by_name
        FROM sk.usulan_kenaikan_pangkat u
        JOIN sk.users d ON u.dosen_id = d.id
        LEFT JOIN sk.users p ON u.processed_by = p.id
        WHERE ${whereClause}
        ORDER BY u.created_at DESC
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
      console.error('Error in Usulan.getAll:', error);
      throw error;
    }
  }

  /**
   * Soft delete usulan
   * @param {string} id - Usulan ID
   * @returns {Promise<boolean>}
   */
  static async softDelete(id) {
    try {
      const query = `
        UPDATE sk.usulan_kenaikan_pangkat
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL AND status = 'draft'
      `;

      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in Usulan.softDelete:', error);
      throw error;
    }
  }

  /**
   * Get usulan with kegiatan detail
   * @param {string} id - Usulan ID
   * @returns {Promise<Object|null>}
   */
  static async getWithKegiatan(id) {
    try {
      // Get usulan
      const usulan = await this.findById(id);
      if (!usulan) return null;

      // Get related kegiatan (verified only)
      const kegiatanQuery = `
        SELECT k.*, ref.nama_kegiatan, kat.nama_kategori
        FROM sk.kegiatan_dosen k
        JOIN sk.ref_kegiatan_kum ref ON k.ref_kegiatan_id = ref.id
        JOIN sk.ref_kategori_kum kat ON ref.kategori_id = kat.id
        WHERE k.dosen_id = $1 
          AND k.status = 'verified'
          AND k.deleted_at IS NULL
          AND k.created_at <= $2
        ORDER BY k.created_at DESC
      `;

      const kegiatanResult = await pool.query(kegiatanQuery, [
        usulan.dosen_id,
        usulan.created_at,
      ]);

      return {
        ...usulan,
        kegiatan_list: kegiatanResult.rows,
      };
    } catch (error) {
      console.error('Error in Usulan.getWithKegiatan:', error);
      throw error;
    }
  }
}

module.exports = Usulan;
