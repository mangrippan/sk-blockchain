/**
 * Authentication Middleware
 * JWT token verification
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from Authorization header
 */
const auth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization header',
        message: 'Authentication required',
      });
    }
    
    // Extract token (format: "Bearer TOKEN")
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;
    
    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authentication required',
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'prima-api',
      audience: 'prima-app',
    });
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      nip: decoded.nip,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication failed',
      });
    }
    
    return res.status(500).json({
      error: 'Authentication error',
      message: error.message,
    });
  }
};

/**
 * Check if user has required role(s)
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Please login first',
      });
    }
    
    const userRole = req.user.role;
    
    // Convert single role to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    
    next();
  };
};

module.exports = {
  auth,
  checkRole,
};
