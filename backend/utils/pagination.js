/**
 * Pagination Utilities
 * Validates and sanitizes pagination parameters
 */

// Maximum allowed limit per query to prevent DoS
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * Sanitize and validate pagination parameters
 * @param {object} query - Request query object
 * @returns {object} Sanitized pagination params
 */
function sanitizePagination(query) {
  const limit = Math.min(
    Math.max(parseInt(query.limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  
  const offset = Math.max(parseInt(query.offset) || DEFAULT_OFFSET, 0);
  
  const page = query.page ? Math.max(parseInt(query.page), 1) : null;
  
  return {
    limit,
    offset: page ? (page - 1) * limit : offset,
    page: page || Math.floor(offset / limit) + 1,
  };
}

/**
 * Calculate pagination metadata
 * @param {number} total - Total number of records
 * @param {number} limit - Records per page
 * @param {number} page - Current page number
 * @returns {object} Pagination metadata
 */
function getPaginationMeta(total, limit, page) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total: parseInt(total),
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = {
  MAX_LIMIT,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  sanitizePagination,
  getPaginationMeta,
};
