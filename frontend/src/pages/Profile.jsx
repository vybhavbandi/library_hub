import Navbar from '../components/Navbar.jsx';
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI, booksAPI } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const Profile = () => {
  const { isAuthenticated, user: authUser, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadAllData();
  }, [isAuthenticated, authLoading, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load profile
      const profileRes = await userAPI.getProfile();
      const profileData = profileRes.data?.data || profileRes.data;
      setProfile(profileData);
      setEditForm({
        name: profileData?.name || authUser?.name || '',
        email: profileData?.email || authUser?.email || '',
      });

      // Load history (don't fail if this errors)
      try {
        const historyRes = await userAPI.getBorrowHistory({ limit: 50 });
        const historyData = historyRes.data?.data || historyRes.data || [];
        setHistory(Array.isArray(historyData) ? historyData : []);
      } catch (e) {
        console.log('Could not load history:', e);
        setHistory([]);
      }

      // Load active borrows (don't fail if this errors)
      try {
        const activeRes = await userAPI.getActiveBorrows();
        const activeData = activeRes.data?.data?.data || activeRes.data?.data || [];
        setActiveBorrows(Array.isArray(activeData) ? activeData : []);
      } catch (e) {
        console.log('Could not load active borrows:', e);
        setActiveBorrows([]);
      }

    } catch (err) {
      console.error('Profile load error:', err);
      // If profile fails, use auth user data
      if (authUser) {
        setProfile(authUser);
        setEditForm({
          name: authUser?.name || '',
          email: authUser?.email || '',
        });
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await userAPI.updateProfile(editForm);
      setIsEditing(false);
      showMessage('success', 'Profile updated successfully!');
      await loadAllData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnBook = async (bookId) => {
    setActionLoading(true);
    try {
      await booksAPI.returnBook(bookId);
      showMessage('success', 'Book returned successfully!');
      await loadAllData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to return book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewBook = async (borrowId) => {
    setActionLoading(true);
    try {
      await userAPI.renewBook(borrowId);
      showMessage('success', 'Book renewed! Due date extended by 14 days.');
      await loadAllData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to renew book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const calculateStats = () => {
    const completed = history.filter(b => b.status === 'RETURNED').length;
    const active = history.filter(b => b.status === 'BORROWED' || b.status === 'RENEWED').length;
    const overdue = history.filter(b => 
      (b.status === 'BORROWED' || b.status === 'OVERDUE') && new Date(b.dueAt) < new Date()
    ).length;
    const totalFines = history.reduce((sum, b) => sum + (parseFloat(b.fineAmount) || 0), 0);
    
    return {
      totalBorrows: history.length,
      activeBorrows: active,
      returnedBooks: completed,
      overdueBorrows: overdue,
      totalFines: totalFines,
    };
  };

  // Show loading while auth is checking
  if (authLoading) {
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

  if (error && !profile && !authUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <div className="mt-4 space-x-2">
              <button onClick={loadAllData} className="btn-primary">Retry</button>
              <button onClick={() => navigate('/login')} className="btn-secondary">Login Again</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayProfile = profile || authUser || {};
  const stats = calculateStats();

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

        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

        {/* Profile Header Card */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0 mb-4 md:mb-0">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {displayProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{displayProfile?.name || 'User'}</h2>
                  <p className="text-gray-600">{displayProfile?.email || ''}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      displayProfile?.role === 'ADMIN' || displayProfile?.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {displayProfile?.role || 'USER'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-2">
                  <button onClick={() => setIsEditing(!isEditing)} className="btn-secondary">
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                  <button onClick={handleLogout} className="btn-danger">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <form onSubmit={handleEditProfile} className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <button type="submit" disabled={actionLoading} className="btn-primary">
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalBorrows}</div>
            <div className="text-sm text-gray-500">Total Borrows</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeBorrows}</div>
            <div className="text-sm text-gray-500">Currently Reading</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdueBorrows}</div>
            <div className="text-sm text-gray-500">Overdue</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">${stats.totalFines.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Total Fines</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'active', label: `Active (${activeBorrows.length})` },
              { id: 'history', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currently Reading */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Currently Reading</h3>
              {activeBorrows.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No books currently borrowed</p>
                  <Link to="/" className="btn-primary">Browse Books</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBorrows.slice(0, 3).map((borrow) => {
                    const isOverdue = new Date(borrow.dueAt) < new Date();
                    const daysLeft = Math.ceil((new Date(borrow.dueAt) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={borrow.id} className={`p-4 rounded-lg border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{borrow.book?.title}</h4>
                            <p className="text-sm text-gray-500">by {borrow.book?.author}</p>
                            <p className={`text-sm mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                              {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `Due in ${daysLeft} days`}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {(borrow.renewedCount || 0) < 2 && !isOverdue && (
                              <button
                                onClick={() => handleRenewBook(borrow.id)}
                                disabled={actionLoading}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Renew
                              </button>
                            )}
                            <button
                              onClick={() => handleReturnBook(borrow.book?.id)}
                              disabled={actionLoading}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Return
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/" className="block w-full btn-primary text-center">Browse Books</Link>
                <Link to="/reading-history" className="block w-full btn-secondary text-center">Full Reading History</Link>
                {(displayProfile?.role === 'ADMIN' || displayProfile?.role === 'admin') && (
                  <Link to="/admin" className="block w-full btn-secondary text-center">Admin Dashboard</Link>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-2">Borrowing Limit</h4>
                <p className="text-sm text-gray-600">
                  Currently borrowed: <span className="font-medium">{activeBorrows.length}/5</span>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(activeBorrows.length / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Active Borrows ({activeBorrows.length})</h3>
            {activeBorrows.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No books currently borrowed</p>
                <Link to="/" className="btn-primary">Browse Books</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBorrows.map((borrow) => {
                  const isOverdue = new Date(borrow.dueAt) < new Date();
                  const daysLeft = Math.ceil((new Date(borrow.dueAt) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={borrow.id} className={`p-4 rounded-lg border ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                            📚
                          </div>
                          <div>
                            <h4 className="font-medium">{borrow.book?.title}</h4>
                            <p className="text-sm text-gray-500">by {borrow.book?.author}</p>
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="text-sm">
                            <p className="text-gray-500">Borrowed: {new Date(borrow.borrowedAt).toLocaleDateString()}</p>
                            <p className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                              Due: {new Date(borrow.dueAt).toLocaleDateString()}
                              {isOverdue ? ` (${Math.abs(daysLeft)} days overdue)` : ` (${daysLeft} days left)`}
                            </p>
                            <p className="text-gray-500">Renewals: {borrow.renewedCount || 0}/2</p>
                          </div>
                          <div className="flex space-x-2">
                            {(borrow.renewedCount || 0) < 2 && !isOverdue && (
                              <button
                                onClick={() => handleRenewBook(borrow.id)}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Renew
                              </button>
                            )}
                            <button
                              onClick={() => handleReturnBook(borrow.book?.id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Return
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Borrowing History</h3>
              <Link to="/reading-history" className="text-blue-600 text-sm hover:underline">View Full History →</Link>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No borrowing history yet</p>
                <Link to="/" className="btn-primary">Start Reading</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-12 bg-gray-200 rounded flex items-center justify-center text-lg">
                        📚
                      </div>
                      <div>
                        <p className="font-medium">{entry.book?.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.borrowedAt).toLocaleDateString()}
                          {entry.returnedAt && ` - ${new Date(entry.returnedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      entry.status === 'RETURNED' ? 'bg-green-100 text-green-800' :
                      entry.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
