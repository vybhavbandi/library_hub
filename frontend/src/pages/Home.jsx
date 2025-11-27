import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { booksAPI } from '../services/api.js';

const Home = () => {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadFeaturedBooks();
  }, []);

  const loadFeaturedBooks = async () => {
    try {
      const response = await booksAPI.getBooks({ page: 1, limit: 8 });
      const booksData = response.data?.data?.books || response.data?.books || [];
      setFeaturedBooks(booksData);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchParams) => {
    const searchQuery = typeof searchParams === 'string' ? searchParams : searchParams.query;
    setQuery(searchQuery || '');
    
    if (!searchQuery && typeof searchParams === 'string') {
      setBooks([]);
      return;
    }

    setSearchLoading(true);
    try {
      const params = typeof searchParams === 'object' ? searchParams : { query: searchParams };
      const response = await booksAPI.searchBooks(params);
      const booksData = response.data?.data?.books || response.data?.books || [];
      setBooks(booksData);
    } catch (error) {
      console.error('Search failed:', error);
      setBooks([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const categories = [
    { name: "Programming", color: "bg-blue-500", icon: "💻" },
    { name: "Web Development", color: "bg-green-500", icon: "🌐" },
    { name: "Database", color: "bg-purple-500", icon: "🗄️" },
    { name: "Computer Science", color: "bg-yellow-500", icon: "🔬" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Discover Your
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Next Great Read
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Explore our collection of programming and technology books
            </p>
            <div className="max-w-3xl mx-auto">
              <SearchBar onSearch={handleSearch} initialValue={query} />
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {(books.length > 0 || searchLoading) && (
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {searchLoading ? 'Searching...' : `Search Results for "${query}"`}
            </h2>
            {searchLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {books.map((book) => (
                  <Link key={book.id} to={`/book/${book.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-6xl">📚</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{book.genre}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${book.availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {book.availableCopies > 0 ? 'Available' : 'Borrowed'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Featured Books */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Books</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : featuredBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBooks.map((book) => (
                <Link key={book.id} to={`/book/${book.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <span className="text-6xl">📚</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600">{book.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">by {book.author}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{book.genre || 'General'}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${book.availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Borrowed'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No books available yet.</p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className={`w-20 h-20 ${category.color} rounded-full mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2">LibraryHub</h3>
          <p className="text-gray-400">Your digital gateway to knowledge</p>
          <p className="text-gray-500 mt-4 text-sm">© {new Date().getFullYear()} LibraryHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
