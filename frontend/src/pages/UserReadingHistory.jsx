import Navbar from '../components/Navbar.jsx';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI, booksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';

const UserReadingHistory = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, authLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load history
      const historyRes = await userAPI.getBorrowHistory({ limit: 100 });
      const historyData = historyRes.data?.data || historyRes.data || [];
      setHistory(Array.isArray(historyData) ? historyData : []);
      
      // Load active borrows separately (don't fail if this errors)
      try {
        const activeRes = await userAPI.getActiveBorrows();
        const activeData = activeRes.data?.data?.data || activeRes.data?.data || [];
        setActiveBorrows(Array.isArray(activeData) ? activeData : []);
      } catch (e) {
        console.log('Could not load active borrows:', e);
        // Calculate from history instead
        const active = historyData.filter(h => h.status === 'BORROWED' || h.status === 'RENEWED');
        setActiveBorrows(active);
      }
    } catch (err) {
      console.error('History load error:', err);
      setError(err.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleReturnBook = async (bookId, borrowId) => {
    setActionLoading(borrowId);
    try {
      await booksAPI.returnBook(bookId);
      showMessage('success', 'Book returned successfully!');
      await loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to return book');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenewBook = async (borrowId) => {
    setActionLoading(borrowId);
    try {
      await userAPI.renewBook(borrowId);
      showMessage('success', 'Book renewed! Due date extended by 14 days.');
      await loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to renew book');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter and sort logic
  const getFilteredHistory = () => {
    let filtered = [...history];
    
    // Apply filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter(e => e.status === 'BORROWED' || e.status === 'RENEWED');
        break;
      case 'returned':
        filtered = filtered.filter(e => e.status === 'RETURNED');
        break;
      case 'overdue':
        filtered = filtered.filter(e => 
          (e.status === 'BORROWED' || e.status === 'OVERDUE' || e.status === 'RENEWED') && 
          new Date(e.dueAt) < new Date()
        );
        break;
      default:
        break;
    }

    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = (a.book?.title || '').localeCompare(b.book?.title || '');
          break;
        case 'author':
          comparison = (a.book?.author || '').localeCompare(b.book?.author || '');
          break;
        case 'due':
          comparison = new Date(a.dueAt) - new Date(b.dueAt);
          break;
        case 'date':
        default:
          comparison = new Date(a.borrowedAt) - new Date(b.borrowedAt);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  // Calculate stats
  const stats = {
    total: history.length,
    active: history.filter(e => e.status === 'BORROWED' || e.status === 'RENEWED').length,
    returned: history.filter(e => e.status === 'RETURNED').length,
    overdue: history.filter(e => 
      (e.status === 'BORROWED' || e.status === 'OVERDUE' || e.status === 'RENEWED') && 
      new Date(e.dueAt) < new Date()
    ).length,
  };

  const getDaysInfo = (dueAt, status) => {
    const now = new Date();
    const due = new Date(dueAt);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (status === 'RETURNED') return null;
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false, isUrgent: true };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} days left`, isOverdue: false, isUrgent: true };
    } else {
      return { text: `${diffDays} days left`, isOverdue: false, isUrgent: false };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
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

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reading History</h1>
          <Link to="/profile" className="btn-secondary">Back to Profile</Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button onClick={loadData} className="mt-2 text-red-600 underline">Retry</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`card p-4 text-center transition-all ${filter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Borrows</div>
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`card p-4 text-center transition-all ${filter === 'active' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <div className="text-sm text-gray-500">Currently Reading</div>
          </button>
          <button
            onClick={() => setFilter('returned')}
            className={`card p-4 text-center transition-all ${filter === 'returned' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-2xl font-bold text-green-600">{stats.returned}</div>
            <div className="text-sm text-gray-500">Returned</div>
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`card p-4 text-center transition-all ${filter === 'overdue' ? 'ring-2 ring-red-500' : ''}`}
          >
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-500">Overdue</div>
          </button>
        </div>

        {/* Filters and Sort */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <div className="flex space-x-1">
                {['all', 'active', 'returned', 'overdue'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                >
                  <option value="date">Borrow Date</option>
                  <option value="due">Due Date</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                </select>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 hover:bg-gray-100 rounded"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredHistory.length} of {history.length} records
        </p>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No reading history yet' : `No ${filter} books`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'Start borrowing books to build your reading history!'
                : 'Try changing the filter to see more results.'}
            </p>
            {filter === 'all' && (
              <Link to="/" className="btn-primary">Browse Books</Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((entry) => {
              const daysInfo = getDaysInfo(entry.dueAt, entry.status);
              const isActive = entry.status === 'BORROWED' || entry.status === 'RENEWED';
              const canRenew = isActive && (entry.renewedCount || 0) < 2 && !daysInfo?.isOverdue;
              
              return (
                <div 
                  key={entry.id} 
                  className={`card p-4 transition-all hover:shadow-lg ${
                    daysInfo?.isOverdue ? 'border-l-4 border-l-red-500 bg-red-50' :
                    daysInfo?.isUrgent ? 'border-l-4 border-l-yellow-500 bg-yellow-50' :
                    isActive ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Book Info */}
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {entry.book?.coverImage ? (
                          <img src={entry.book.coverImage} alt={entry.book.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">📚</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/book/${entry.book?.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-1"
                        >
                          {entry.book?.title}
                        </Link>
                        <p className="text-sm text-gray-600">by {entry.book?.author}</p>
                        {entry.book?.genre && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {entry.book.genre}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dates and Status */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Borrowed</p>
                          <p className="font-medium">{new Date(entry.borrowedAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Due</p>
                          <p className={`font-medium ${daysInfo?.isOverdue ? 'text-red-600' : ''}`}>
                            {new Date(entry.dueAt).toLocaleDateString()}
                          </p>
                        </div>
                        {entry.returnedAt && (
                          <div>
                            <p className="text-gray-500">Returned</p>
                            <p className="font-medium">{new Date(entry.returnedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="flex flex-col items-start md:items-end gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          entry.status === 'RETURNED' ? 'bg-green-100 text-green-800' :
                          daysInfo?.isOverdue ? 'bg-red-100 text-red-800' :
                          entry.status === 'RENEWED' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {daysInfo?.isOverdue ? 'OVERDUE' : entry.status}
                        </span>
                        {daysInfo && (
                          <span className={`text-xs ${
                            daysInfo.isOverdue ? 'text-red-600 font-medium' :
                            daysInfo.isUrgent ? 'text-yellow-600 font-medium' :
                            'text-gray-500'
                          }`}>
                            {daysInfo.text}
                          </span>
                        )}
                        {isActive && (
                          <span className="text-xs text-gray-500">
                            Renewals: {entry.renewedCount || 0}/2
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {isActive && (
                        <div className="flex space-x-2">
                          {canRenew && (
                            <button
                              onClick={() => handleRenewBook(entry.id)}
                              disabled={actionLoading === entry.id}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                            >
                              {actionLoading === entry.id ? '...' : 'Renew'}
                            </button>
                          )}
                          <button
                            onClick={() => handleReturnBook(entry.book?.id, entry.id)}
                            disabled={actionLoading === entry.id}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            {actionLoading === entry.id ? '...' : 'Return'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fine Info */}
                  {entry.fineAmount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-red-600">
                        Fine: ${parseFloat(entry.fineAmount).toFixed(2)}
                        {!entry.finePaid && <span className="ml-2 text-xs">(Unpaid)</span>}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load More / Pagination could go here */}
        {filteredHistory.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Showing all {filteredHistory.length} records
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReadingHistory;
