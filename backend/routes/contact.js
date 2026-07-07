const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { protect } = require('../middleware/auth');
const transporter = require('../config/mailer');
const { contactLimiter } = require('../middleware/rateLimiter');

function validateObjectId(id, res) {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    res.status(400).json({ error: 'Invalid message ID format' });
    return false;
  }
  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 1: POST /api/contact
// Customer submits contact form — PUBLIC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const errors = [];
    if (!name || name.length < 2) errors.push('Name must be at least 2 characters');
    if (!email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.push('Valid email is required');
    if (!subject) errors.push('Subject is required');
    if (!message || message.length < 10) errors.push('Message must be at least 10 characters');

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await ContactMessage.countDocuments({
      email: email.toLowerCase().trim(),
      createdAt: { $gte: twentyFourHoursAgo }
    });
    if (recentCount >= 3) {
      return res.status(429).json({ error: 'Too many messages from this email. Please wait 24 hours before sending again.' });
    }

    const contactMessage = new ContactMessage({ name, email, phone, subject, message });
    await contactMessage.save();

    try {
      const whatsappNumber = process.env.WHATSAPP_NUMBER || '';
      await transporter.sendMail({
        from: `"AutoShine" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'We received your message — AutoShine',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Message Received</title>
            <style>
              body { margin: 0; padding: 0; background-color: #0f0f0f; font-family: 'Segoe UI', sans-serif; }
              .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; }
              .header { background: #0f0f0f; padding: 30px; text-align: center; border-bottom: 3px solid #d4af37; }
              .logo { color: #d4af37; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
              .content { padding: 30px; }
              .greeting { font-size: 20px; margin-bottom: 15px; color: #d4af37; }
              .message { font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #e0e0e0; }
              .reference { background: #d4af37; color: #0f0f0f; padding: 10px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .whatsapp-btn { background: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; margin: 20px 0; }
              .business-hours { background: #333; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .footer { background: #0f0f0f; padding: 20px; text-align: center; color: #888; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">AUTOSHINE</div>
              <div class="content">
                <div class="greeting">Hi ${name},</div>
                <div class="message">Thank you for reaching out to AutoShine.</div>
                <div class="message">We have received your message regarding: <strong>${subject}</strong></div>
                <div class="message">Our team will get back to you within 1 hour during business hours.</div>
                <div class="reference">Reference: ${contactMessage.referenceId}</div>
                <div class="business-hours">
                  <strong>Business Hours:</strong><br>
                  Mon - Fri: 8:00 AM - 6:00 PM<br>
                  Saturday: 8:00 AM - 5:00 PM<br>
                  Sunday: 10:00 AM - 4:00 PM
                </div>
                <div class="message">For urgent queries, chat with us on WhatsApp.</div>
                <a href="https://wa.me/${whatsappNumber}" class="whatsapp-btn">WhatsApp Us</a>
              </div>
              <div class="footer">AutoShine Mobile Car Detailing</div>
          </body>
          </html>
        `
      });
    } catch (emailErr) {
      console.error('Auto-reply email failed:', emailErr.message);
    }

    try {
      await transporter.sendMail({
        from: `"AutoShine" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `📩 New Contact Message — ${subject}`,
        html: `
          <h3>New Message Alert</h3>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong><br>${message}</p>
          <p><strong>Reference:</strong> ${contactMessage.referenceId}</p>
          <p><strong>Received at:</strong> ${new Date().toISOString()}</p>
          <a href="mailto:${email}" style="background:#d4af37;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Quick Reply</a>
        `
      });
    } catch (emailErr) {
      console.error('Owner notification email failed:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will get back to you within 1 hour.',
      referenceId: contactMessage.referenceId
    });
  } catch (error) {
    console.error('Contact form error:', error);
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation Error', details });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Duplicate field value', field: Object.keys(error.keyValue) });
    }
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 2: GET /api/contact
// Admin gets all contact messages — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/', protect, async (req, res) => {
  try {
    const { isRead, isReplied, subject, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (isReplied !== undefined) query.isReplied = isReplied === 'true';
    if (subject) query.subject = subject;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [messages, total, unreadCount] = await Promise.all([
      ContactMessage.find(query).sort({ [sortBy]: sortDirection }).skip(skip).limit(limitNum),
      ContactMessage.countDocuments(query),
      ContactMessage.getUnreadCount()
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: messages,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalMessages: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      unreadCount
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 3: GET /api/contact/:id
// Admin views single message — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/:id', protect, async (req, res) => {
  try {
    const id = req.params.id;
    if (!validateObjectId(id, res)) return;

    const message = await ContactMessage.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (!message.isRead) {
      message.isRead = true;
      await message.save();
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Fetch message error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 4: PUT /api/contact/:id
// Admin updates message — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.put('/:id', protect, async (req, res) => {
  try {
    const id = req.params.id;
    if (!validateObjectId(id, res)) return;

    const message = await ContactMessage.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const allowedUpdates = {};
    if (req.body.isRead !== undefined) allowedUpdates.isRead = req.body.isRead;
    if (req.body.isReplied !== undefined) allowedUpdates.isReplied = req.body.isReplied;
    if (req.body.adminNotes !== undefined) allowedUpdates.adminNotes = req.body.adminNotes;

    Object.assign(message, allowedUpdates);
    await message.save();

    res.json({ success: true, message: 'Message updated successfully', data: message });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 5: DELETE /api/contact/:id
// Admin deletes message — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.delete('/:id', protect, async (req, res) => {
  try {
    const id = req.params.id;
    if (!validateObjectId(id, res)) return;

    const result = await ContactMessage.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: 'Message not found' });

    res.json({ success: true, message: 'Message deleted successfully', deletedId: id });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 6: PUT /api/contact/:id/mark-read
// Toggle read status — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.put('/:id/mark-read', protect, async (req, res) => {
  try {
    const id = req.params.id;
    if (!validateObjectId(id, res)) return;

    const message = await ContactMessage.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.isRead = !message.isRead;
    await message.save();

    res.json({
      success: true,
      message: `Message marked as ${message.isRead ? 'read' : 'unread'}`,
      isRead: message.isRead
    });
  } catch (error) {
    console.error('Toggle read error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 7: PUT /api/contact/:id/mark-replied
// Mark as replied — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.put('/:id/mark-replied', protect, async (req, res) => {
  try {
    const id = req.params.id;
    if (!validateObjectId(id, res)) return;

    const message = await ContactMessage.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    message.isReplied = true;
    message.isRead = true;
    await message.save();

    res.json({ success: true, message: 'Message marked as replied', data: message });
  } catch (error) {
    console.error('Mark replied error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 8: DELETE /api/contact/bulk-delete
// Bulk delete messages — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.delete('/bulk-delete', protect, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required and must not be empty' });
    }

    const result = await ContactMessage.deleteMany({ _id: { $in: ids } });
    res.json({
      success: true,
      message: `${result.deletedCount} messages deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 9: GET /api/contact/stats
// Contact message statistics — PRIVATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/stats', protect, async (req, res) => {
  try {
    const [total, unread, unreplied, bySubject, todayResult, thisWeekResult] = await Promise.all([
      ContactMessage.countDocuments(),
      ContactMessage.getUnreadCount(),
      ContactMessage.countDocuments({ isReplied: false }),
      ContactMessage.aggregate([
        { $group: { _id: '$subject', count: { $sum: 1 } } }
      ]),
      ContactMessage.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      ContactMessage.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const bySubjectMap = {};
    bySubject.forEach(item => { bySubjectMap[item._id] = item.count; });

    res.json({
      success: true,
      data: {
        total,
        unread,
        unreplied,
        bySubject: bySubjectMap,
        todayCount: todayResult,
        thisWeekCount: thisWeekResult
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;
