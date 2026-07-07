const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CUSTOMER INFORMATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Customer name must be at least 2 characters'],
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    minlength: [10, 'Phone number must be at least 10 digits'],
    maxlength: [20, 'Phone number cannot exceed 20 digits']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CAR INFORMATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  carMake: {
    type: String,
    required: [true, 'Car make is required'],
    trim: true,
    example: 'Toyota'
  },

  carModel: {
    type: String,
    required: [true, 'Car model is required'],
    trim: true,
    example: 'Corolla'
  },

  carYear: {
    type: Number,
    required: [true, 'Car year is required'],
    min: [1990, 'Car year must be 1990 or later'],
    max: [new Date().getFullYear() + 1, 'Please provide a valid car year']
  },

  carColor: {
    type: String,
    trim: true,
    default: 'Not specified'
  },

  carSize: {
    type: String,
    required: [true, 'Car size is required'],
    enum: {
      values: ['Sedan', 'SUV / Crossover', 'Truck / Van', 'Luxury / Exotic'],
      message: 'Please select a valid car size'
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // APPOINTMENT INFORMATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: [
      'Basic Detail',
      'Standard Detail',
      'Premium Detail',
      'Exterior Wash Only',
      'Interior Deep Clean Only',
      'Paint Polish & Correction',
      'Wax & Paint Sealant',
      'Ceramic Coating',
      'Engine Bay Cleaning'
    ]
  },

  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function (v) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return v >= today;
      },
      message: 'Appointment date cannot be in the past'
    }
  },

  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    enum: [
      '8:00 AM – 9:00 AM',
      '9:00 AM – 10:00 AM',
      '10:00 AM – 11:00 AM',
      '11:00 AM – 12:00 PM',
      '12:00 PM – 1:00 PM',
      '1:00 PM – 2:00 PM',
      '2:00 PM – 3:00 PM',
      '3:00 PM – 4:00 PM',
      '4:00 PM – 5:00 PM'
    ]
  },

  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    minlength: [10, 'Address must be at least 10 characters'],
    maxlength: [500, 'Address cannot exceed 500 characters']
  },

  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATUS & TRACKING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },

  statusHistory: [
    {
      status: { type: String },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: String, default: 'system' }
    }
  ],

  bookingReference: {
    type: String,
    unique: true,
    sparse: true
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRICING INFO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  estimatedPrice: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIRTUAL FIELD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

appointmentSchema.virtual('carFullName').get(function () {
  return `${this.carYear} ${this.carMake} ${this.carModel}`;
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRE-SAVE HOOKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Hook 1 — Generate booking reference
appointmentSchema.pre('save', function (next) {
  if (this.isNew && !this.bookingReference) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.bookingReference = `AS-${year}-${randomNum}`;
  }
  next();
});

// Hook 2 — Calculate estimated price
appointmentSchema.pre('save', function (next) {
  const pricingMatrix = {
    'Basic Detail': {
      'Sedan': 2500,
      'SUV / Crossover': 3500,
      'Truck / Van': 4000,
      'Luxury / Exotic': 5000
    },
    'Standard Detail': {
      'Sedan': 5000,
      'SUV / Crossover': 6500,
      'Truck / Van': 7500,
      'Luxury / Exotic': 9000
    },
    'Premium Detail': {
      'Sedan': 9500,
      'SUV / Crossover': 12000,
      'Truck / Van': 14000,
      'Luxury / Exotic': 18000
    },
    'Exterior Wash Only': {
      'Sedan': 800,
      'SUV / Crossover': 1200,
      'Truck / Van': 1500,
      'Luxury / Exotic': 1800
    },
    'Interior Deep Clean Only': {
      'Sedan': 2000,
      'SUV / Crossover': 2800,
      'Truck / Van': 3500,
      'Luxury / Exotic': 4000
    },
    'Paint Polish & Correction': {
      'Sedan': 6500,
      'SUV / Crossover': 8500,
      'Truck / Van': 10000,
      'Luxury / Exotic': 12000
    },
    'Wax & Paint Sealant': {
      'Sedan': 4000,
      'SUV / Crossover': 5500,
      'Truck / Van': 6500,
      'Luxury / Exotic': 8000
    },
    'Ceramic Coating': {
      'Sedan': 18000,
      'SUV / Crossover': 24000,
      'Truck / Van': 28000,
      'Luxury / Exotic': 35000
    },
    'Engine Bay Cleaning': {
      'Sedan': 2500,
      'SUV / Crossover': 3500,
      'Truck / Van': 4000,
      'Luxury / Exotic': 5000
    }
  };

  if (this.serviceType && this.carSize) {
    const servicePrices = pricingMatrix[this.serviceType];
    if (servicePrices && servicePrices[this.carSize]) {
      this.estimatedPrice = servicePrices[this.carSize];
    }
  }
  next();
});

// Hook 3 — Track status history
appointmentSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: 'system'
    });
  }
  next();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATIC METHODS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

appointmentSchema.statics.getStats = async function () {
  const total = await this.countDocuments();
  const pending = await this.countDocuments({ status: 'Pending' });
  const confirmed = await this.countDocuments({ status: 'Confirmed' });
  const completed = await this.countDocuments({ status: 'Completed' });
  const cancelled = await this.countDocuments({ status: 'Cancelled' });

  return {
    total,
    pending,
    confirmed,
    completed,
    cancelled
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INDEXES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ email: 1 });
appointmentSchema.index({ bookingReference: 1 }, { unique: true, sparse: true });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = mongoose.model('Appointment', appointmentSchema);
