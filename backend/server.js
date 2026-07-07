require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const appointmentsRouter = require('./routes/appointments');
const contactRouter = require('./routes/contact');
const adminRouter = require('./routes/admin');
const { notFound, globalErrorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MIDDLEWARE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only requests from your real Netlify site (or local dev) are allowed.
// Set FRONTEND_URL in your .env / Render dashboard to your live Netlify URL.
const allowedOrigins = [
  process.env.FRONTEND_URL,          // e.g. https://superb-sopapillas-328181.netlify.app
  'http://127.0.0.1:5500',           // local Live Server (dev only)
  'http://localhost:5500'            // local Live Server (dev only)
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow tools like curl/Postman (no origin header) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MONGODB CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((error) => console.log('❌ MongoDB Connection Error:', error));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RATE LIMITER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use('/api/', generalLimiter);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use('/api/appointments', appointmentsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/admin', adminRouter);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROOT ROUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get('/', (req, res) => {
  res.json({
    message: 'AutoShine API is running',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date()
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEALTH CHECK ROUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime()
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 404 HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(notFound);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOBAL ERROR HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(globalErrorHandler);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// START SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.listen(PORT, () => {
  console.log('🚗 AutoShine Server running on port', PORT);
  console.log('📡 API ready at http://localhost:' + PORT);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NODEMAILER SETUP (shared module — also used by routes/contact.js)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const transporter = require('./config/mailer');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL HELPER FUNCTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendConfirmationEmail(appointmentData) {
  const {
    customerName,
    email,
    phone,
    serviceType,
    appointmentDate,
    appointmentTime,
    address,
    carMake,
    carModel,
    carYear
  } = appointmentData;

  const whatsappNumber = process.env.WHATSAPP_NUMBER || '';

  // Customer confirmation email
  const customerMailOptions = {
    from: `"AutoShine" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Booking Confirmed — AutoShine',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Booking Confirmed</title>
        <style>
          body { margin: 0; padding: 0; background-color: #0f0f0f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #ffffff; }
          .header { background-color: #0f0f0f; padding: 30px; text-align: center; border-bottom: 3px solid #d4af37; }
          .logo { color: #d4af37; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 30px; }
          .greeting { font-size: 20px; margin-bottom: 15px; color: #d4af37; }
          .message { font-size: 16px; line-height: 1.6; margin-bottom: 25px; color: #e0e0e0; }
          .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .summary-table td { padding: 12px 15px; border-bottom: 1px solid #333; }
          .summary-table td:first-child { color: #d4af37; font-weight: 600; width: 30%; }
          .summary-table td:last-child { color: #ffffff; }
          .footer { background-color: #0f0f0f; padding: 20px; text-align: center; border-top: 1px solid #333; color: #888; font-size: 14px; }
          .footer a { color: #d4af37; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUTOSHINE</div>
          </div>
          <div class="content">
            <div class="greeting">Hi ${customerName},</div>
            <div class="message">
              Your appointment has been received! We will contact you within 1 hour to confirm.
            </div>
            <table class="summary-table">
              <tr>
                <td>Service:</td>
                <td>${serviceType}</td>
              </tr>
              <tr>
                <td>Date:</td>
                <td>${appointmentDate}</td>
              </tr>
              <tr>
                <td>Time:</td>
                <td>${appointmentTime}</td>
              </tr>
              <tr>
                <td>Address:</td>
                <td>${address}</td>
              </tr>
              <tr>
                <td>Car:</td>
                <td>${carMake} ${carModel} ${carYear}</td>
              </tr>
            </table>
          </div>
          <div class="footer">
            Questions? WhatsApp us at <a href="https://wa.me/${whatsappNumber}">${whatsappNumber}</a>
          </div>
        </div>
      </body>
      </html>
    `
  };

  // Business owner notification email
  const ownerMailOptions = {
    from: `"AutoShine" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `🚗 New Booking — ${customerName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>New Booking</title>
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; }
          .header { background-color: #0f0f0f; padding: 25px; text-align: center; border-bottom: 3px solid #d4af37; }
          .logo { color: #d4af37; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
          .content { padding: 25px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #0f0f0f; }
          .detail { padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: 600; color: #d4af37; display: inline-block; width: 120px; }
          .phone-box { background-color: #fff8e1; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0; }
          .phone-box .label { color: #0f0f0f; }
          .action { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; font-size: 14px; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AUTOSHINE</div>
          </div>
          <div class="content">
            <div class="title">🚗 New Booking Received</div>
            <div class="detail"><span class="label">Customer:</span> ${customerName}</div>
            <div class="detail"><span class="label">Email:</span> ${email}</div>
            <div class="phone-box">
              <div class="detail"><span class="label">Phone:</span> ${phone}</div>
            </div>
            <div class="detail"><span class="label">Service:</span> ${serviceType}</div>
            <div class="detail"><span class="label">Date:</span> ${appointmentDate}</div>
            <div class="detail"><span class="label">Time:</span> ${appointmentTime}</div>
            <div class="detail"><span class="label">Address:</span> ${address}</div>
            <div class="detail"><span class="label">Car:</span> ${carMake} ${carModel} ${carYear}</div>
            <div class="action">
              <strong>Quick Action:</strong> Contact the customer within 1 hour to confirm the appointment.
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(ownerMailOptions);
    console.log('✅ Confirmation emails sent successfully');
  } catch (error) {
    console.error('❌ Error sending confirmation emails:', error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = app;
module.exports.transporter = transporter;
module.exports.sendConfirmationEmail = sendConfirmationEmail;

