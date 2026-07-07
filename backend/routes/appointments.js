const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/rateLimiter');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 1: POST /api/appointments
// Create new booking — PUBLIC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/', bookingLimiter, async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      carMake,
      carModel,
      carYear,
      carColor,
      carSize,
      serviceType,
      appointmentDate,
      appointmentTime,
      address,
      notes
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'customerName', 'phone', 'email',
      'carMake', 'carModel', 'carYear', 'carSize',
      'serviceType', 'appointmentDate', 'appointmentTime',
      'address'
    ];
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing
      });
    }

    // Check for duplicate booking
    const existing = await Appointment.findOne({
      email: email.toLowerCase().trim(),
      appointmentDate: new Date(appointmentDate),
      appointmentTime
    });
    if (existing) {
      return res.status(409).json({
        error: 'A booking already exists for this date and time with this email'
      });
    }

    // Create and save appointment
    const appointment = new Appointment({
      customerName,
      phone,
      email,
      carMake,
      carModel,
      carYear,
      carColor,
      carSize,
      serviceType,
      appointmentDate,
      appointmentTime,
      address,
      notes
    });

    await appointment.save();

    // Send confirmation email to customer + notification to owner
    try {
      const { sendConfirmationEmail } = require('../server');
      await sendConfirmationEmail(appointment);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: {
        bookingReference: appointment.bookingReference,
        customerName: appointment.customerName,
        serviceType: appointment.serviceType,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        estimatedPrice: appointment.estimatedPrice,
        status: appointment.status
      }
    });

  } catch (error) {
    console.error('Booking error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation Error', messages });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate field value',
        field: Object.keys(error.keyValue)
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 2: GET /api/appointments
// Get all appointments — PRIVATE (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/', protect, async (req, res) => {
  try {
    const {
      status,
      date,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { customerName: regex },
        { phone: regex },
        { email: regex }
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [appointments, total, stats] = await Promise.all([
      Appointment.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      Appointment.countDocuments(query),
      Appointment.getStats()
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalAppointments: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      stats
    });

  } catch (error) {
    console.error('Fetch appointments error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 3: GET /api/appointments/:id
// Get single appointment — PRIVATE (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ success: true, data: appointment });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }
    console.error('Fetch appointment error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 4: PUT /api/appointments/:id
// Update appointment — PRIVATE (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.put('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const allowedUpdates = ['status', 'notes', 'appointmentDate', 'appointmentTime'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        appointment[field] = req.body[field];
      }
    });

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation Error', messages });
    }
    console.error('Update appointment error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTE 5: DELETE /api/appointments/:id
// Delete appointment — PRIVATE (Admin only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.delete('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid appointment ID format' });
    }
    console.error('Delete appointment error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

module.exports = router;
