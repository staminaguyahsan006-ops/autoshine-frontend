const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CONTACT INFORMATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
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

  phone: {
    type: String,
    trim: true,
    default: 'Not provided'
  },

  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: [
      'General Inquiry',
      'Booking Question',
      'Pricing Information',
      'Service Question',
      'Complaint or Feedback',
      'Partnership Inquiry',
      'Other'
    ]
  },

  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATUS TRACKING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  isRead: {
    type: Boolean,
    default: false
  },

  isReplied: {
    type: Boolean,
    default: false
  },

  adminNotes: {
    type: String,
    default: '',
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },

  referenceId: {
    type: String,
    unique: true,
    sparse: true
  }

}, {
  timestamps: true
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRE-SAVE HOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

contactSchema.pre('save', function (next) {
  if (this.isNew && !this.referenceId) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.referenceId = `MSG-${year}-${randomNum}`;
  }
  next();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATIC METHODS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

contactSchema.statics.getUnreadCount = async function () {
  return await this.countDocuments({ isRead: false });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INDEXES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

contactSchema.index({ isRead: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ subject: 1 });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = mongoose.model('ContactMessage', contactSchema);

