import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters'],
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple documents with null/undefined ISBN
    trim: true,
    match: [/^(?:\d{9}[\dX]|\d{13})$/, 'Please enter a valid ISBN'],
  },
  genre: {
    type: String,
    trim: true,
    maxlength: [50, 'Genre cannot exceed 50 characters'],
  },
  publishedYear: {
    type: Number,
    min: [1000, 'Published year must be at least 1000'],
    max: [new Date().getFullYear() + 1, 'Published year cannot be in the future'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  coverImage: {
    type: String,
    trim: true,
  },
  totalCopies: {
    type: Number,
    required: [true, 'Total copies is required'],
    min: [1, 'Total copies must be at least 1'],
    default: 1,
  },
  availableCopies: {
    type: Number,
    required: [true, 'Available copies is required'],
    min: [0, 'Available copies cannot be negative'],
    default: function() {
      return this.totalCopies;
    },
  },
  location: {
    shelf: String,
    section: String,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for better search performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ genre: 1 });
bookSchema.index({ publishedYear: 1 });
bookSchema.index({ isbn: 1 });
bookSchema.index({ isActive: 1 });

// Virtual for borrowed copies
bookSchema.virtual('borrowedCopies').get(function() {
  return this.totalCopies - this.availableCopies;
});

// Ensure availableCopies doesn't exceed totalCopies
bookSchema.pre('save', function(next) {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

// Static method to search books
bookSchema.statics.searchBooks = function(query, options = {}) {
  const {
    page = 1,
    limit = 10,
    genre,
    publishedYear,
    sortBy = 'title',
    sortOrder = 'asc',
  } = options;

  const searchQuery = {
    isActive: true,
    ...(query && {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ],
    }),
    ...(genre && { genre: new RegExp(genre, 'i') }),
    ...(publishedYear && { publishedYear }),
  };

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find(searchQuery)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit);
};

export default mongoose.model('Book', bookSchema);
