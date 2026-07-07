require('dotenv').config();
const nodemailer = require('nodemailer');

// Shared transporter — imported by server.js, appointments.js, and contact.js.
// Having ONE place for this avoids the circular-require bug where contact.js
// used to import server.js before server.js had finished setting up the
// transporter, leaving it permanently undefined.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;
