import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Book from '../models/Book.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

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

// @route   GET /api/books
// @desc    Get all books with pagination and filtering
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('genre').optional().trim(),
  query('publishedYear').optional().isInt({ min: 1000 }).withMessage('Invalid published year'),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      genre,
      publishedYear,
      sortBy = 'title',
      sortOrder = 'asc',
    } = req.query;

    const query = { isActive: true };
    
    if (genre) {
      query.genre = new RegExp(genre, 'i');
    }
    
    if (publishedYear) {
      query.publishedYear = parseInt(publishedYear);
    }

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
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
    });
  }
});

// @route   GET /api/books/search
// @desc    Search books
// @access  Public
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      q: searchQuery,
      page = 1,
      limit = 12,
      genre,
      publishedYear,
      sortBy = 'title',
      sortOrder = 'asc',
    } = req.query;

    const books = await Book.searchBooks(searchQuery, {
      page: parseInt(page),
      limit: parseInt(limit),
      genre,
      publishedYear: publishedYear ? parseInt(publishedYear) : undefined,
      sortBy,
      sortOrder,
    });

    // Get total count for pagination
    const searchQueryObj = {
      isActive: true,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { author: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $in: [new RegExp(searchQuery, 'i')] } },
      ],
      ...(genre && { genre: new RegExp(genre, 'i') }),
      ...(publishedYear && { publishedYear: parseInt(publishedYear) }),
    };

    const totalBooks = await Book.countDocuments(searchQueryObj);
    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      success: true,
      books,
      searchQuery,
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
    console.error('Search books error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
});

// @route   GET /api/books/:id
// @desc    Get single book by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true });
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      ...book.toObject(),
    });
  } catch (error) {
    console.error('Get book error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
    });
  }
});

// @route   POST /api/books/:id/borrow
// @desc    Borrow a book
// @access  Private
router.post('/:id/borrow', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true });
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No copies available for borrowing',
      });
    }

    // Check if user already has this book borrowed
    const existingBorrow = await BorrowRecord.findOne({
      user: req.user._id,
      book: book._id,
      status: { $in: ['borrowed', 'overdue', 'renewed'] },
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'You already have this book borrowed',
      });
    }

    // Check user's active borrows limit (e.g., max 5 books)
    const activeBorrows = await BorrowRecord.countDocuments({
      user: req.user._id,
      status: { $in: ['borrowed', 'overdue', 'renewed'] },
    });

    if (activeBorrows >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum borrowing limit (5 books)',
      });
    }

    // Create borrow record
    const borrowRecord = new BorrowRecord({
      user: req.user._id,
      book: book._id,
    });

    await borrowRecord.save();

    // Update book availability
    book.availableCopies -= 1;
    await book.save();

    // Populate the borrow record for response
    await borrowRecord.populate(['user', 'book']);

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      borrowRecord,
    });
  } catch (error) {
    console.error('Borrow book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to borrow book',
    });
  }
});

// @route   POST /api/books/:id/reserve
// @desc    Reserve a book (placeholder - could be extended)
// @access  Private
router.post('/:id/reserve', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true });
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // For now, just return success (reservation logic can be extended)
    res.json({
      success: true,
      message: 'Book reserved successfully (feature coming soon)',
      book,
    });
  } catch (error) {
    console.error('Reserve book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reserve book',
    });
  }
});

// @route   POST /api/books/:id/return
// @desc    Return a borrowed book
// @access  Private
router.post('/:id/return', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isActive: true });
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Find active borrow record
    const borrowRecord = await BorrowRecord.findOne({
      user: req.user._id,
      book: book._id,
      status: { $in: ['borrowed', 'overdue', 'renewed'] },
    });

    if (!borrowRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active borrow record found for this book',
      });
    }

    // Update borrow record
    borrowRecord.returnedAt = new Date();
    borrowRecord.status = 'returned';
    await borrowRecord.save();

    // Update book availability
    book.availableCopies += 1;
    await book.save();

    await borrowRecord.populate(['user', 'book']);

    res.json({
      success: true,
      message: 'Book returned successfully',
      borrowRecord,
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return book',
    });
  }
});

export default router;
