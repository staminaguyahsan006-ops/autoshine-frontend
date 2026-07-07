const jwt = require('jsonwebtoken');
require('dotenv').config();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// protect — Required authentication
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. No token provided.',
      message: 'Please login to access this resource'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    console.log(`[AUTH] Admin accessed: ${req.method} ${req.url} at ${new Date()}`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      error: 'Invalid token. Please login again.',
      code: 'INVALID_TOKEN'
    });
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// optionalAuth — Allows guest or authed access
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = decoded;
    } catch {
      // silently ignore invalid/expired token for optional routes
    }
  }
  next();
}

module.exports = { protect, optionalAuth };

