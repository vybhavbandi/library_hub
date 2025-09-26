import express from 'express';
import { body, query, validationResult } from 'express-validator';
import User from '../models/User.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

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

// @route   GET /api/user/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    ...req.user.toJSON(),
  });
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account',
        });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// @route   GET /api/user/borrow-history
// @desc    Get user's borrowing history
// @access  Private
router.get('/borrow-history', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['borrowed', 'returned', 'overdue', 'renewed']).withMessage('Invalid status'),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
    } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const borrowHistory = await BorrowRecord.find(query)
      .populate('book')
      .sort({ borrowedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalRecords = await BorrowRecord.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      success: true,
      data: borrowHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        limit: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get borrow history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch borrow history',
    });
  }
});

// @route   GET /api/user/active-borrows
// @desc    Get user's currently borrowed books
// @access  Private
router.get('/active-borrows', async (req, res) => {
  try {
    const activeBorrows = await BorrowRecord.getActiveBorrows(req.user._id);

    res.json({
      success: true,
      data: activeBorrows,
      count: activeBorrows.length,
    });
  } catch (error) {
    console.error('Get active borrows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active borrows',
    });
  }
});

// @route   POST /api/user/renew/:borrowId
// @desc    Renew a borrowed book
// @access  Private
router.post('/renew/:borrowId', async (req, res) => {
  try {
    const borrowRecord = await BorrowRecord.findOne({
      _id: req.params.borrowId,
      user: req.user._id,
      status: { $in: ['borrowed', 'renewed'] },
    }).populate('book');

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found or cannot be renewed',
      });
    }

    await borrowRecord.renew();

    res.json({
      success: true,
      message: 'Book renewed successfully',
      borrowRecord,
    });
  } catch (error) {
    console.error('Renew book error:', error);
    
    if (error.message === 'Maximum renewals exceeded') {
      return res.status(400).json({
        success: false,
        message: 'This book has already been renewed the maximum number of times',
      });
    }
    
    if (error.message === 'Can only renew active borrows') {
      return res.status(400).json({
        success: false,
        message: 'This book is not currently borrowed or is overdue',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to renew book',
    });
  }
});

// @route   GET /api/user/stats
// @desc    Get user's borrowing statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get various statistics
    const [
      totalBorrows,
      activeBorrows,
      overdueBorrows,
      returnedBooks,
      totalFines,
    ] = await Promise.all([
      BorrowRecord.countDocuments({ user: userId }),
      BorrowRecord.countDocuments({ user: userId, status: { $in: ['borrowed', 'renewed'] } }),
      BorrowRecord.countDocuments({ user: userId, status: 'overdue' }),
      BorrowRecord.countDocuments({ user: userId, status: 'returned' }),
      BorrowRecord.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, totalFines: { $sum: '$fineAmount' } } },
      ]),
    ]);

    // Get most borrowed genres
    const genreStats = await BorrowRecord.aggregate([
      { $match: { user: userId } },
      { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'bookInfo' } },
      { $unwind: '$bookInfo' },
      { $group: { _id: '$bookInfo.genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      stats: {
        totalBorrows,
        activeBorrows,
        overdueBorrows,
        returnedBooks,
        totalFines: totalFines[0]?.totalFines || 0,
        favoriteGenres: genreStats,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
    });
  }
});

export default router;
