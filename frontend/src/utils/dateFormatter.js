/**
 * Date Formatting Utilities for Prima
 * 
 * Handles both:
 * 1. ISO date strings (from PostgreSQL)
 * 2. Protobuf Timestamp objects (from Hyperledger Fabric blockchain)
 */

/**
 * Convert Protobuf Timestamp to JavaScript Date
 * @param {Object} timestamp - Protobuf timestamp {seconds: number, nanos: number}
 * @returns {Date}
 */
export function protobufToDate(timestamp) {
  if (!timestamp || typeof timestamp !== 'object') {
    throw new Error('Invalid protobuf timestamp')
  }
  
  const { seconds, nanos = 0 } = timestamp
  const milliseconds = seconds * 1000 + nanos / 1000000
  return new Date(milliseconds)
}

/**
 * Format date to Indonesian locale
 * Automatically handles both ISO strings and Protobuf Timestamp objects
 * 
 * @param {string|Object} dateInput - ISO date string or Protobuf timestamp
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatDate(dateInput, options = {}) {
  if (!dateInput) return '-'
  
  let date
  
  // Handle Protobuf Timestamp format from blockchain (Fabric)
  if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
    date = protobufToDate(dateInput)
  } else {
    // Handle regular ISO date string
    date = new Date(dateInput)
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', dateInput)
    return '-'
  }
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }
  
  return date.toLocaleDateString('id-ID', defaultOptions)
}

/**
 * Format date with time
 * @param {string|Object} dateInput - ISO date string or Protobuf timestamp
 * @returns {string} - Formatted date with time
 */
export function formatDateTime(dateInput) {
  return formatDate(dateInput, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format date in short format
 * @param {string|Object} dateInput - ISO date string or Protobuf timestamp
 * @returns {string} - Short formatted date
 */
export function formatDateShort(dateInput) {
  return formatDate(dateInput, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Object} dateInput - ISO date string or Protobuf timestamp
 * @returns {string} - Relative time string
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '-'
  
  let date
  if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
    date = protobufToDate(dateInput)
  } else {
    date = new Date(dateInput)
  }
  
  if (isNaN(date.getTime())) return '-'
  
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit yang lalu`
  if (diffHour < 24) return `${diffHour} jam yang lalu`
  if (diffDay < 7) return `${diffDay} hari yang lalu`
  
  return formatDateShort(dateInput)
}

/**
 * Check if timestamp is from blockchain (Protobuf format)
 * @param {any} timestamp
 * @returns {boolean}
 */
export function isProtobufTimestamp(timestamp) {
  return typeof timestamp === 'object' && 
         timestamp !== null && 
         'seconds' in timestamp
}

export default {
  formatDate,
  formatDateTime,
  formatDateShort,
  formatRelativeTime,
  protobufToDate,
  isProtobufTimestamp
}
