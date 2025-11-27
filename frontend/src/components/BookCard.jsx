import React from 'react';
import { Link } from 'react-router-dom';

const BookCard = ({ book }) => {
  const {
    id,
    title,
    author,
    isbn,
    genre,
    publishedYear,
    coverImage,
    availableCopies,
    totalCopies,
    description,
  } = book;

  const isAvailable = availableCopies > 0;

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col h-full">
        {/* Book Cover */}
        <div className="flex-shrink-0 mb-4">
          {coverImage ? (
            <img
              src={coverImage}
              alt={`${title} cover`}
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg
                className="h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {title}
          </h3>
          <p className="text-gray-600 mb-2">by {author}</p>
          
          {genre && (
            <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full mb-2">
              {genre}
            </span>
          )}

          {publishedYear && (
            <p className="text-sm text-gray-500 mb-2">Published: {publishedYear}</p>
          )}

          {isbn && (
            <p className="text-sm text-gray-500 mb-2">ISBN: {isbn}</p>
          )}

          {description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {description}
            </p>
          )}
        </div>

        {/* Availability Status */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  isAvailable ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <span className={`text-sm font-medium ${
                isAvailable ? 'text-green-700' : 'text-red-700'
              }`}>
                {isAvailable ? 'Available' : 'Not Available'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {availableCopies}/{totalCopies} copies
            </span>
          </div>

          {/* Action Button */}
          <Link
            to={`/book/${id}`}
            className="btn-primary w-full text-center block"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
