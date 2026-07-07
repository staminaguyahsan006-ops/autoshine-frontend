// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCTION 1: validateEmail
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCTION 2: validatePhone
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validatePhone = (phone) => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return cleaned.length >= 10 &&
         cleaned.length <= 15 &&
         /^\+?[\d]+$/.test(cleaned);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCTION 3: validateDate
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validateDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date instanceof Date &&
         !isNaN(date) &&
         date >= today;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCTION 4: validateBookingInput
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validateBookingInput = (data) => {
  const errors = [];

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.push('Please provide a valid phone number (min 10 digits)');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.carMake || data.carMake.trim().length < 2) {
    errors.push('Car make is required');
  }

  if (!data.carModel || data.carModel.trim().length < 1) {
    errors.push('Car model is required');
  }

  if (!data.carYear || data.carYear < 1990 || data.carYear > new Date().getFullYear() + 1) {
    errors.push('Please provide a valid car year');
  }

  const validSizes = ['Sedan', 'SUV / Crossover', 'Truck / Van', 'Luxury / Exotic'];
  if (!data.carSize || !validSizes.includes(data.carSize)) {
    errors.push('Please select a valid car size');
  }

  const validServices = [
    'Basic Detail', 'Standard Detail', 'Premium Detail',
    'Exterior Wash Only', 'Interior Deep Clean Only',
    'Paint Polish & Correction', 'Wax & Paint Sealant',
    'Ceramic Coating', 'Engine Bay Cleaning'
  ];
  if (!data.serviceType || !validServices.includes(data.serviceType)) {
    errors.push('Please select a valid service');
  }

  if (!data.appointmentDate || !validateDate(data.appointmentDate)) {
    errors.push('Please select a valid future date for your appointment');
  }

  if (!data.appointmentTime) {
    errors.push('Please select a time slot');
  }

  if (!data.address || data.address.trim().length < 10) {
    errors.push('Please provide your full address (minimum 10 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCTION 5: validateContactInput
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const validateContactInput = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  const validSubjects = [
    'General Inquiry', 'Booking Question',
    'Pricing Information', 'Service Question',
    'Complaint or Feedback', 'Partnership Inquiry', 'Other'
  ];
  if (!data.subject || !validSubjects.includes(data.subject)) {
    errors.push('Please select a valid subject');
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  if (data.message && data.message.trim().length > 2000) {
    errors.push('Message cannot exceed 2000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCTION 6: sanitizeInput
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCTION 7: sanitizeObject
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const sanitizeObject = (obj) => {
  const sanitized = {};
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  });
  return sanitized;
};

module.exports = {
  validateEmail,
  validatePhone,
  validateDate,
  validateBookingInput,
  validateContactInput,
  sanitizeInput,
  sanitizeObject
};

