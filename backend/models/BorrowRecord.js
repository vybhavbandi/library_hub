import mongoose from 'mongoose';

const borrowRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required'],
  },
  borrowedAt: {
    type: Date,
    default: Date.now,
  },
  dueAt: {
    type: Date,
    required: [true, 'Due date is required'],
    default: function() {
      // Default to 14 days from borrow date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      return dueDate;
    },
  },
  returnedAt: {
    type: Date,
  },
  renewedCount: {
    type: Number,
    default: 0,
    max: [2, 'Maximum 2 renewals allowed'],
  },
  status: {
    type: String,
    enum: ['borrowed', 'returned', 'overdue', 'renewed'],
    default: 'borrowed',
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: [0, 'Fine amount cannot be negative'],
  },
  finePaid: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
});

// Indexes
borrowRecordSchema.index({ user: 1, status: 1 });
borrowRecordSchema.index({ book: 1, status: 1 });
borrowRecordSchema.index({ dueAt: 1, status: 1 });
borrowRecordSchema.index({ borrowedAt: 1 });

// Virtual to check if overdue
borrowRecordSchema.virtual('isOverdue').get(function() {
  return this.status === 'borrowed' && new Date() > this.dueAt;
});

// Pre-save middleware to update status
borrowRecordSchema.pre('save', function(next) {
  // Update status based on return date and due date
  if (this.returnedAt) {
    this.status = 'returned';
  } else if (new Date() > this.dueAt && this.status === 'borrowed') {
    this.status = 'overdue';
    // Calculate fine (e.g., $1 per day overdue)
    const daysOverdue = Math.ceil((new Date() - this.dueAt) / (1000 * 60 * 60 * 24));
    this.fineAmount = daysOverdue * 1; // $1 per day
  }
  next();
});

// Static method to get active borrows for a user
borrowRecordSchema.statics.getActiveBorrows = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['borrowed', 'overdue', 'renewed'] },
  }).populate('book');
};

// Static method to get borrow history for a user
borrowRecordSchema.statics.getBorrowHistory = function(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  return this.find({ user: userId })
    .populate('book')
    .sort({ borrowedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Method to renew the borrow
borrowRecordSchema.methods.renew = function() {
  if (this.renewedCount >= 2) {
    throw new Error('Maximum renewals exceeded');
  }
  
  if (this.status !== 'borrowed') {
    throw new Error('Can only renew active borrows');
  }
  
  // Extend due date by 14 days
  this.dueAt = new Date(this.dueAt.getTime() + (14 * 24 * 60 * 60 * 1000));
  this.renewedCount += 1;
  this.status = 'renewed';
  
  return this.save();
};

export default mongoose.model('BorrowRecord', borrowRecordSchema);
