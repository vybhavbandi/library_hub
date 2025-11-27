import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { wishlistAPI, booksAPI } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const Wishlist = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadWishlist();
  }, [isAuthenticated, authLoading, navigate]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const response = await wishlistAPI.getWishlist();
      const data = response.data?.data?.wishlist || [];
      setWishlist(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleRemove = async (bookId) => {
    setActionLoading(bookId);
    try {
      await wishlistAPI.removeFromWishlist(bookId);
      showMessage('success', 'Removed from wishlist');
      await loadWishlist();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to remove');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBorrow = async (bookId) => {
    setActionLoading(bookId);
    try {
      await booksAPI.borrowBook(bookId);
      showMessage('success', 'Book borrowed successfully!');
      await loadWishlist();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to borrow');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Message Toast */}
        {message.text && (
          <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{wishlist.length} books saved</p>
          </div>
          <Link to="/" className="btn-primary">Browse More Books</Link>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">💝</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Save books you want to read later!</p>
            <Link to="/" className="btn-primary">Discover Books</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => {
              const book = item.book;
              const isAvailable = book?.availableCopies > 0;
              
              return (
                <div key={item.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                    {book?.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-6xl">📚</span>
                    )}
                  </div>
                  <div className="p-4">
                    <Link to={`/book/${book?.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1">
                      {book?.title}
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by {book?.author}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                        {book?.genre || 'General'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {isAvailable ? 'Available' : 'Borrowed'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </p>

                    <div className="flex space-x-2">
                      {isAvailable && (
                        <button
                          onClick={() => handleBorrow(book?.id)}
                          disabled={actionLoading === book?.id}
                          className="flex-1 btn-primary text-sm"
                        >
                          {actionLoading === book?.id ? '...' : 'Borrow'}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(book?.id)}
                        disabled={actionLoading === book?.id}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Remove from wishlist"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
