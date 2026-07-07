// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// In-memory request store with periodic cleanup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const requestStore = {};

setInterval(() => {
  const now = Date.now();
  Object.keys(requestStore).forEach(ip => {
    if (requestStore[ip].resetTime < now) {
      delete requestStore[ip];
    }
  });
}, 10 * 60 * 1000); // Every 10 minutes

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Factory to create limiters with custom config
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function createLimiter(config) {
  return function limiter(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const { windowMs, maxRequests, blockDurationMs, name } = config;

    if (!requestStore[ip]) {
      requestStore[ip] = {
        count: 1,
        resetTime: now + windowMs,
        blocked: false
      };
      return next();
    }

    const record = requestStore[ip];

    if (record.blocked) {
      if (now < record.blockedUntil) {
        const retryAfter = Math.ceil((record.blockedUntil - now) / 1000 / 60);
        return res.status(429).json({
          error: 'Too many requests. You are temporarily blocked.',
          retryAfter: `${retryAfter} minutes`,
          code: 'RATE_LIMITED'
        });
      } else {
        record.blocked = false;
        record.count = 0;
        record.resetTime = now + windowMs;
      }
    }

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      record.blocked = true;
      record.blockedUntil = now + (blockDurationMs || windowMs);

      if (name === 'adminLogin') {
        console.log(`[RATE LIMIT] Admin login blocked for IP: ${ip} until ${new Date(record.blockedUntil)}`);
      }

      return res.status(429).json({
        error: 'Rate limit exceeded.',
        retryAfter: `${Math.ceil((record.blockedUntil - now) / 1000 / 60)} minutes`,
        code: 'RATE_LIMITED'
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    next();
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIMITER 1: generalLimiter — 100 requests per 15 min
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const generalLimiter = createLimiter({
  name: 'general',
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  blockDurationMs: 15 * 60 * 1000
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIMITER 2: bookingLimiter — 5 bookings per hour
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const bookingLimiter = createLimiter({
  name: 'booking',
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  blockDurationMs: 60 * 60 * 1000
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIMITER 3: contactLimiter — 3 messages per hour
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const contactLimiter = createLimiter({
  name: 'contact',
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  blockDurationMs: 60 * 60 * 1000
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIMITER 4: adminLoginLimiter — 5 attempts per 15 min, block 30 min
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const adminLoginLimiter = createLimiter({
  name: 'adminLogin',
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  blockDurationMs: 30 * 60 * 1000
});

module.exports = {
  generalLimiter,
  bookingLimiter,
  contactLimiter,
  adminLoginLimiter
};

