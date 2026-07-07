const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const { protect } = require('../middleware/auth');
const { adminLoginLimiter } = require('../middleware/rateLimiter');
const Appointment = require('../models/Appointment');
const ContactMessage = require('../models/ContactMessage');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RATE LIMITING: Track failed login attempts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIP(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function isBlocked(ip) {
  const record = loginAttempts[ip];
  if (!record || !record.blocked) return false;
  if (Date.now() - record.lastAttempt > BLOCK_DURATION_MS) {
    delete loginAttempts[ip];
    return false;
  }
  return true;
}

function getRetryAfter(ip) {
  const record = loginAttempts[ip];
  if (!record) return 0;
  const elapsed = Date.now() - record.lastAttempt;
  const remaining = Math.ceil((BLOCK_DURATION_MS - elapsed) / 60000);
  return Math.max(0, remaining);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 1: POST /api/admin/login
// Admin login — PUBLIC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = getClientIP(req);

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (isBlocked(ip)) {
      return res.status(429).json({
        error: 'Too many failed attempts. Account locked for 15 minutes.',
        retryAfter: getRetryAfter(ip)
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Supports up to 2 admin accounts (you + a friend), each
    // checked against a bcrypt HASH — never a plaintext password.
    // Generate a hash with:
    //   node -e "console.log(require('bcryptjs').hashSync('yourPassword', 10))"
    // and put the result in ADMIN_PASSWORD_HASH / ADMIN_PASSWORD_HASH_2.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const accounts = [
      { user: process.env.ADMIN_USERNAME, hash: process.env.ADMIN_PASSWORD_HASH },
      { user: process.env.ADMIN_USERNAME_2, hash: process.env.ADMIN_PASSWORD_HASH_2 }
    ].filter(a => a.user && a.hash);

    let matchedAccount = null;
    for (const acc of accounts) {
      if (username === acc.user && await bcryptjs.compare(password, acc.hash)) {
        matchedAccount = acc;
        break;
      }
    }

    if (!matchedAccount) {
      if (!loginAttempts[ip]) {
        loginAttempts[ip] = { count: 0, lastAttempt: Date.now(), blocked: false };
      }
      loginAttempts[ip].count += 1;
      loginAttempts[ip].lastAttempt = Date.now();

      if (loginAttempts[ip].count >= MAX_ATTEMPTS) {
        loginAttempts[ip].blocked = true;
      }

      return res.status(401).json({
        error: 'Invalid username or password',
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - loginAttempts[ip].count)
      });
    }

    // Reset on successful login
    delete loginAttempts[ip];

    const jwtToken = jwt.sign(
      { username, role: 'admin', loginTime: new Date() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log(`[ADMIN LOGIN] Successful login from IP: ${ip} at ${new Date()}`);

    res.json({
      success: true,
      message: 'Login successful',
      token: jwtToken,
      admin: {
        username,
        role: 'admin',
        loginTime: new Date()
      },
      expiresIn: '7 days'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 2: POST /api/admin/logout
// Admin logout — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/logout', protect, async (req, res) => {
  try {
    console.log(`[ADMIN LOGOUT] Admin logged out at ${new Date()}`);
    res.json({
      success: true,
      message: 'Logged out successfully. Please clear your local token.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 3: GET /api/admin/verify
// Verify token validity — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/verify', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      admin: req.admin,
      valid: true
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 4: GET /api/admin/dashboard
// Dashboard statistics — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/dashboard', protect, async (req, res) => {
  try {
    const now = new Date();

    // 1. Appointment stats
    const apptStats = await Appointment.getStats();

    // 2. Today appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayAppointments = await Appointment.find({
      appointmentDate: { $gte: today, $lt: tomorrow }
    });

    // 3. This week appointments (Monday start)
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekCount = await Appointment.countDocuments({
      appointmentDate: { $gte: weekStart, $lt: weekEnd }
    });

    // 4. This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthCount = await Appointment.countDocuments({
      appointmentDate: { $gte: monthStart, $lt: monthEnd }
    });

    // 5. This month revenue
    const revenueResult = await Appointment.aggregate([
      {
        $match: {
          status: 'Completed',
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$estimatedPrice' }
        }
      }
    ]);
    const monthRevenue = revenueResult[0]?.total || 0;

    // 6. Popular services
    const popularServices = await Appointment.aggregate([
      { $group: { _id: '$serviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // 7. Recent bookings
    const recentBookings = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // 8. Unread messages
    const unreadCount = await ContactMessage.getUnreadCount();

    // 9. Monthly booking trend (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyTrend = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        appointments: {
          ...apptStats,
          today: todayAppointments.length,
          thisWeek: weekCount,
          thisMonth: monthCount
        },
        revenue: {
          thisMonth: monthRevenue,
          currency: 'USD'
        },
        popularServices,
        recentBookings,
        messages: {
          unread: unreadCount
        },
        monthlyTrend,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 5: PUT /api/admin/change-password
// Change password — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const currentMatches = await bcryptjs.compare(currentPassword, process.env.ADMIN_PASSWORD_HASH || '');
    if (!currentMatches) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasUppercase = /[A-Z]/.test(newPassword);

    if (!hasMinLength || !hasNumber || !hasUppercase) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters, contain one number, and one uppercase letter'
      });
    }

    const newHash = await bcryptjs.hash(newPassword, 10);

    res.json({
      success: true,
      message: 'Password verified. Update your .env / Render env variable with this new hash:',
      instruction: `Set ADMIN_PASSWORD_HASH=${newHash} in your environment and restart the server. (Never store the plain password.)`
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 6: GET /api/admin/activity-log
// Recent system activity — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/activity-log', protect, async (req, res) => {
  try {
    const [recentAppointments, recentMessages] = await Promise.all([
      Appointment.find().sort({ updatedAt: -1 }).limit(20).lean(),
      ContactMessage.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);

    const activities = [];

    recentAppointments.forEach(appt => {
      activities.push({
        type: 'booking',
        description: `New booking from ${appt.customerName}`,
        time: appt.updatedAt || appt.createdAt,
        status: appt.status,
        reference: appt.bookingReference
      });
    });

    recentMessages.forEach(msg => {
      activities.push({
        type: 'message',
        description: `New message from ${msg.name}`,
        time: msg.createdAt,
        status: msg.isRead ? 'Read' : 'Unread',
        reference: msg.referenceId
      });
    });

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      success: true,
      activities: activities.slice(0, 30),
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;
