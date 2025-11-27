import Navbar from '../components/Navbar.jsx';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksAPI, userAPI, wishlistAPI } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [userBorrowedThis, setUserBorrowedThis] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await booksAPI.getBook(id);
      const bookData = response.data?.data || response.data;
      setBook(bookData);

      // Check if user has this book borrowed and in wishlist
      if (isAuthenticated) {
        try {
          const historyRes = await userAPI.getBorrowHistory();
          const history = historyRes.data?.data || historyRes.data || [];
          const hasBorrowed = Array.isArray(history) && history.some(
            entry => entry.book?.id === parseInt(id) && 
            (entry.status === 'BORROWED' || entry.status === 'RENEWED')
          );
          setUserBorrowedThis(hasBorrowed);
          
          // Check wishlist
          const wishlistRes = await wishlistAPI.checkInWishlist(id);
          setInWishlist(wishlistRes.data?.data?.inWishlist || false);
        } catch (e) {
          console.log('Could not check status');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/book/${id}` } });
      return;
    }
    setActionLoading(true);
    try {
      await booksAPI.borrowBook(id);
      await loadBook();
      alert('Book borrowed successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to borrow book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    setActionLoading(true);
    try {
      await booksAPI.returnBook(id);
      await loadBook();
      alert('Book returned successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/book/${id}` } });
      return;
    }
    setActionLoading(true);
    try {
      await booksAPI.reserveBook(id);
      showMessage('success', 'Book reserved! You will be notified when available.');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to reserve book');
    } finally {
      setActionLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/book/${id}` } });
      return;
    }
    setActionLoading(true);
    try {
      if (inWishlist) {
        await wishlistAPI.removeFromWishlist(id);
        setInWishlist(false);
        showMessage('success', 'Removed from wishlist');
      } else {
        await wishlistAPI.addToWishlist(id);
        setInWishlist(true);
        showMessage('success', 'Added to wishlist!');
      }
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error || 'Book not found'}</p>
            <button onClick={() => navigate('/')} className="mt-4 btn-primary">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable = book.availableCopies > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center">
          ← Back
        </button>

        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cover */}
            <div>
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-80 flex items-center justify-center overflow-hidden">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-8xl">📚</span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-4">by {book.author}</p>

              <div className="flex items-center mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isAvailable ? 'Available' : 'Not Available'}
                </span>
                <span className="ml-4 text-gray-500">
                  {book.availableCopies} of {book.totalCopies} copies available
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                {book.genre && (
                  <div>
                    <span className="text-gray-500">Genre:</span>
                    <span className="ml-2 font-medium">{book.genre}</span>
                  </div>
                )}
                {book.publishedYear && (
                  <div>
                    <span className="text-gray-500">Published:</span>
                    <span className="ml-2 font-medium">{book.publishedYear}</span>
                  </div>
                )}
                {book.isbn && (
                  <div>
                    <span className="text-gray-500">ISBN:</span>
                    <span className="ml-2 font-medium">{book.isbn}</span>
                  </div>
                )}
              </div>

              {book.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{book.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {userBorrowedThis ? (
                  <button
                    onClick={handleReturn}
                    disabled={actionLoading}
                    className="btn-primary"
                  >
                    {actionLoading ? 'Processing...' : 'Return Book'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleBorrow}
                      disabled={actionLoading || !isAvailable}
                      className={`btn-primary ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {actionLoading ? 'Processing...' : 'Borrow'}
                    </button>
                    {!isAvailable && (
                      <button
                        onClick={handleReserve}
                        disabled={actionLoading}
                        className="btn-secondary"
                      >
                        Reserve
                      </button>
                    )}
                  </>
                )}
                
                {/* Wishlist Button */}
                <button
                  onClick={handleWishlist}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    inWishlist 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {inWishlist ? '💔 Remove from Wishlist' : '💝 Add to Wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
