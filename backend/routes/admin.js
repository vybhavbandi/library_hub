import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Book from '../models/Book.js';
import User from '../models/User.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Book validation rules
const validateBook = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must not exceed 200 characters'),
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author is required and must not exceed 100 characters'),
  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:\d{9}[\dX]|\d{13})$/)
    .withMessage('Please provide a valid ISBN'),
  body('genre')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Genre must not exceed 50 characters'),
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Please provide a valid published year'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('totalCopies')
    .isInt({ min: 1 })
    .withMessage('Total copies must be at least 1'),
  body('availableCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies cannot be negative'),
];

// ===== DASHBOARD ROUTES =====

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalBooks,
      totalUsers,
      activeBorrowings,
      overdueBorrowings,
      totalFines,
      recentBorrows,
    ] = await Promise.all([
      Book.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, role: 'user' }),
      BorrowRecord.countDocuments({ status: { $in: ['borrowed', 'renewed'] } }),
      BorrowRecord.countDocuments({ status: 'overdue' }),
      BorrowRecord.aggregate([
        { $group: { _id: null, totalFines: { $sum: '$fineAmount' } } },
      ]),
      BorrowRecord.find({ status: { $in: ['borrowed', 'overdue', 'renewed'] } })
        .populate('user', 'name email')
        .populate('book', 'title author')
        .sort({ borrowedAt: -1 })
        .limit(10),
    ]);

    // Get popular books
    const popularBooks = await BorrowRecord.aggregate([
      { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'bookInfo' } },
      { $unwind: '$bookInfo' },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 },
      { $project: { book: '$bookInfo', borrowCount: 1 } },
    ]);

    res.json({
      success: true,
      totalBooks,
      totalUsers,
      activeBorrowings,
      overdueBorrowings,
      totalFines: totalFines[0]?.totalFines || 0,
      recentBorrows,
      popularBooks,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
});

// ===== BOOK MANAGEMENT ROUTES =====

// @route   GET /api/admin/books
// @desc    Get all books for admin (including inactive)
// @access  Private (Admin)
router.get('/books', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('includeInactive').optional().isBoolean().withMessage('includeInactive must be boolean'),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      includeInactive = false,
      sortBy = 'title',
      sortOrder = 'asc',
    } = req.query;

    const query = includeInactive === 'true' ? {} : { isActive: true };
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const books = await Book.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalBooks = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      success: true,
      books,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBooks,
        limit: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get admin books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
    });
  }
});

// @route   POST /api/admin/books
// @desc    Create a new book
// @access  Private (Admin)
router.post('/books', validateBook, handleValidationErrors, async (req, res) => {
  try {
    const bookData = req.body;
    
    // If availableCopies not provided, set it to totalCopies
    if (bookData.availableCopies === undefined) {
      bookData.availableCopies = bookData.totalCopies;
    }

    const book = new Book(bookData);
    await book.save();

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book,
    });
  } catch (error) {
    console.error('Create book error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A book with this ISBN already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create book',
    });
  }
});

// @route   PUT /api/admin/books/:id
// @desc    Update a book
// @access  Private (Admin)
router.put('/books/:id', validateBook, handleValidationErrors, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Update book fields
    Object.keys(req.body).forEach(key => {
      book[key] = req.body[key];
    });

    await book.save();

    res.json({
      success: true,
      message: 'Book updated successfully',
      book,
    });
  } catch (error) {
    console.error('Update book error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A book with this ISBN already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update book',
    });
  }
});

// @route   DELETE /api/admin/books/:id
// @desc    Delete (deactivate) a book
// @access  Private (Admin)
router.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Check if book has active borrows
    const activeBorrows = await BorrowRecord.countDocuments({
      book: book._id,
      status: { $in: ['borrowed', 'overdue', 'renewed'] },
    });

    if (activeBorrows > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with active borrows',
      });
    }

    // Soft delete (deactivate)
    book.isActive = false;
    await book.save();

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
    });
  }
});

// ===== USER MANAGEMENT ROUTES =====

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      includeInactive = false,
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (includeInactive !== 'true') query.isActive = true;

    const users = await User.find(query)
      .select('-refreshTokens') // Don't include refresh tokens
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        limit: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (role, active status)
// @access  Private (Admin)
router.put('/users/:id', [
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
], handleValidationErrors, async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.equals(req.user._id) && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

    // Update fields
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete (deactivate) user
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Check for active borrows
    const activeBorrows = await BorrowRecord.countDocuments({
      user: user._id,
      status: { $in: ['borrowed', 'overdue', 'renewed'] },
    });

    if (activeBorrows > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active borrows',
      });
    }

    // Soft delete (deactivate)
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

export default router;
