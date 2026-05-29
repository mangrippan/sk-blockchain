/**
 * Rate Limiting Middleware
 * Protects against brute force and DoS attacks
 */

const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter for all API endpoints
 * 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the 100 requests in 15 minutes limit. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests to non-sensitive endpoints
  skip: (req) => {
    const skipPaths = ['/health', '/api-docs'];
    return skipPaths.some(path => req.path.startsWith(path));
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 login attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts',
    message: 'You have exceeded the 5 login attempts in 15 minutes limit. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use a custom key generator to include both IP and email/username
  keyGenerator: (req) => {
    // Combine IP with email from request body for better granularity
    const ip = req.ip || req.connection.remoteAddress;
    const identifier = req.body?.email || req.body?.nip || '';
    return `${ip}-${identifier}`;
  },
  // Skip rate limit for successful logins (only count failed attempts)
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for registration endpoint
 * 3 registrations per hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    error: 'Too many registration attempts',
    message: 'You have exceeded the 3 registration attempts per hour limit. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for file uploads
 * 20 uploads per hour per user
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit to 20 uploads per hour
  message: {
    error: 'Too many file uploads',
    message: 'You have exceeded the 20 uploads per hour limit. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use authenticated user ID as key if available
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  registerLimiter,
  uploadLimiter,
};
