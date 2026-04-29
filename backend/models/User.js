/**
 * User Model
 * Handles all database operations for users table
 */

const { pool } = require('../config/database');

class User {
  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = `
        SELECT id, public_id, nip_nidn, nama_lengkap, email, role, 
               department, jabatan_saat_ini, is_active, last_login,
               created_at, updated_at
        FROM sk.users
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in User.findById:', error);
      throw error;
    }
  }

  /**
   * Find user by public_id (UUID)
   * @param {string} publicId - User UUID
   * @returns {Promise<Object|null>}
   */
  static async findByPublicId(publicId) {
    try {
      const query = `
        SELECT id, public_id, nip_nidn, nama_lengkap, email, role, 
               department, jabatan_saat_ini, is_active, last_login,
               created_at, updated_at
        FROM sk.users
        WHERE public_id = $1 AND deleted_at IS NULL
      `;
      
      const result = await pool.query(query, [publicId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in User.findByPublicId:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    try {
      const query = `
        SELECT id, public_id, nip_nidn, nama_lengkap, email, password_hash, role, 
               department, jabatan_saat_ini, is_active, last_login,
               created_at, updated_at
        FROM sk.users
        WHERE email = $1 AND deleted_at IS NULL
      `;
      
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in User.findByEmail:', error);
      throw error;
    }
  }

  /**
   * Find user by NIP/NIDN (hashed)
   * @param {string} nipNidn - Hashed NIP/NIDN
   * @returns {Promise<Object|null>}
   */
  static async findByNIP(nipNidn) {
    try {
      const query = `
        SELECT id, public_id, nip_nidn, nama_lengkap, email, password_hash, role, 
               department, jabatan_saat_ini, is_active, last_login,
               created_at, updated_at
        FROM sk.users
        WHERE nip_nidn = $1 AND deleted_at IS NULL
      `;
      
      const result = await pool.query(query, [nipNidn]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in User.findByNIP:', error);
      throw error;
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  static async create(userData) {
    try {
      const {
        nip_nidn,
        nama_lengkap,
        email,
        password_hash,
        role = 'dosen',
        department = null,
        jabatan_saat_ini = null,
      } = userData;

      const query = `
        INSERT INTO sk.users (
          nip_nidn, nama_lengkap, email, password_hash, role, 
          department, jabatan_saat_ini
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, public_id, nip_nidn, nama_lengkap, email, role, 
                  department, jabatan_saat_ini, is_active, created_at
      `;

      const values = [
        nip_nidn,
        nama_lengkap,
        email,
        password_hash,
        role,
        department,
        jabatan_saat_ini,
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in User.create:', error);
      throw error;
    }
  }

  /**
   * Update user data
   * @param {number} id - User ID
   * @param {Object} userData - Data to update
   * @returns {Promise<Object|null>}
   */
  static async update(id, userData) {
    try {
      const allowedFields = [
        'nama_lengkap',
        'email',
        'department',
        'jabatan_saat_ini',
        'is_active',
      ];

      const updates = [];
      const values = [];
      let paramCounter = 1;

      Object.keys(userData).forEach((key) => {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramCounter}`);
          values.push(userData[key]);
          paramCounter++;
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);

      const query = `
        UPDATE sk.users
        SET ${updates.join(', ')}
        WHERE id = $${paramCounter} AND deleted_at IS NULL
        RETURNING id, public_id, nip_nidn, nama_lengkap, email, role, 
                  department, jabatan_saat_ini, is_active, updated_at
      `;

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in User.update:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} newPasswordHash - New password hash
   * @returns {Promise<boolean>}
   */
  static async updatePassword(id, newPasswordHash) {
    try {
      const query = `
        UPDATE sk.users
        SET password_hash = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      const result = await pool.query(query, [newPasswordHash, id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in User.updatePassword:', error);
      throw error;
    }
  }

  /**
   * Update last login timestamp
   * @param {number} id - User ID
   * @returns {Promise<boolean>}
   */
  static async updateLastLogin(id) {
    try {
      const query = `
        UPDATE sk.users
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
      `;

      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in User.updateLastLogin:', error);
      throw error;
    }
  }

  /**
   * Soft delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>}
   */
  static async softDelete(id) {
    try {
      const query = `
        UPDATE sk.users
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
      `;

      const result = await pool.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in User.softDelete:', error);
      throw error;
    }
  }

  /**
   * Get all users (with pagination)
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async getAll(options = {}) {
    try {
      const {
        role = null,
        is_active = null,
        page = 1,
        limit = 10,
      } = options;

      const offset = (page - 1) * limit;
      const conditions = ['deleted_at IS NULL'];
      const values = [];
      let paramCounter = 1;

      if (role) {
        conditions.push(`role = $${paramCounter}`);
        values.push(role);
        paramCounter++;
      }

      if (is_active !== null) {
        conditions.push(`is_active = $${paramCounter}`);
        values.push(is_active);
        paramCounter++;
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM sk.users
        WHERE ${whereClause}
      `;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      values.push(limit, offset);
      const dataQuery = `
        SELECT id, public_id, nip_nidn, nama_lengkap, email, role, 
               department, jabatan_saat_ini, is_active, last_login,
               created_at, updated_at
        FROM sk.users
        WHERE ${whereClause}
        ORDER BY created_at DESC
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
      console.error('Error in User.getAll:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array>}
   */
  static async getByRole(role) {
    try {
      const query = `
        SELECT id, public_id, nip_nidn, nama_lengkap, email, role, 
               department, jabatan_saat_ini, is_active
        FROM sk.users
        WHERE role = $1 AND deleted_at IS NULL AND is_active = true
        ORDER BY nama_lengkap ASC
      `;

      const result = await pool.query(query, [role]);
      return result.rows;
    } catch (error) {
      console.error('Error in User.getByRole:', error);
      throw error;
    }
  }
}

module.exports = User;
