import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';

const BulkOperations = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [bulkBooks, setBulkBooks] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'admin')) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleBulkAdd = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const lines = bulkBooks.trim().split('\n').filter(line => line.trim());
      let success = 0;
      let failed = 0;
      const errors = [];

      for (const line of lines) {
        try {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length < 2) {
            failed++;
            errors.push(`Invalid format: ${line}`);
            continue;
          }

          const [title, author, genre, copies] = parts;
          await adminAPI.createBook({
            title,
            author,
            genre: genre || 'General',
            totalCopies: parseInt(copies) || 1,
            availableCopies: parseInt(copies) || 1,
          });
          success++;
        } catch (err) {
          failed++;
          errors.push(`Failed: ${line} - ${err.response?.data?.message || err.message}`);
        }
      }

      setResult({ success, failed, errors });
      if (success > 0) setBulkBooks('');
    } catch (error) {
      setResult({ success: 0, failed: 1, errors: [error.message] });
    } finally {
      setLoading(false);
    }
  };

  const sampleFormat = `Clean Code, Robert C. Martin, Programming, 5
The Pragmatic Programmer, David Thomas, Programming, 3
JavaScript: The Good Parts, Douglas Crockford, Web Development, 4`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
          <button onClick={() => navigate('/admin')} className="btn-secondary">Back to Dashboard</button>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Add Books</h2>
          <p className="text-gray-600 mb-4">
            Add multiple books at once. Enter one book per line in the format:
            <code className="bg-gray-100 px-2 py-1 rounded ml-2">Title, Author, Genre, Copies</code>
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Books (one per line)</label>
            <textarea
              value={bulkBooks}
              onChange={(e) => setBulkBooks(e.target.value)}
              className="input-field font-mono text-sm"
              rows="10"
              placeholder={sampleFormat}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleBulkAdd}
              disabled={loading || !bulkBooks.trim()}
              className="btn-primary"
            >
              {loading ? 'Processing...' : 'Add Books'}
            </button>
            <button
              onClick={() => setBulkBooks(sampleFormat)}
              className="btn-secondary"
            >
              Load Sample
            </button>
          </div>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${result.failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="font-medium">
                Results: {result.success} added successfully, {result.failed} failed
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 text-sm text-red-600">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;
