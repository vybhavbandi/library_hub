import React, { useState, useEffect } from 'react';

const BorrowModal = ({ isOpen, onClose, book, onConfirm, type = 'borrow' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');
    try {
      await onConfirm(book.id, type);
      onClose();
    } catch (error) {
      console.error(`${type} failed:`, error);
      setError(error.response?.data?.message || `Failed to ${type} book. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const modalTitle = type === 'borrow' ? 'Borrow Book' : type === 'reserve' ? 'Reserve Book' : 'Return Book';
  const actionText = type === 'borrow' ? 'borrow' : type === 'reserve' ? 'reserve' : 'return';
  const buttonText = type === 'borrow' ? 'Borrow Now' : type === 'reserve' ? 'Reserve Now' : 'Return Book';

  const getModalContent = () => {
    if (type === 'return') {
      return (
        <div className="mb-6">
          <p className="text-gray-700">
            Are you sure you want to return this book?
          </p>
          <div className="mt-2 text-sm text-gray-600">
            <p>• The book will be marked as returned</p>
            <p>• Any outstanding fines will be calculated</p>
            <p>• You can borrow this book again later</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <p className="text-gray-700">
          Are you sure you want to {actionText} this book?
        </p>
        {type === 'borrow' && (
          <div className="mt-2 text-sm text-gray-600">
            <p>• Standard borrowing period is 14 days</p>
            <p>• You can renew once if no reservations exist</p>
            <p>• Late returns may incur fines</p>
          </div>
        )}
        {type === 'reserve' && (
          <div className="mt-2 text-sm text-gray-600">
            <p>• You will be notified when the book becomes available</p>
            <p>• Reservation is valid for 48 hours after notification</p>
            <p>• You can cancel the reservation anytime</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-start space-x-4">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={`${book.title} cover`}
                className="w-16 h-20 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{book.title}</h3>
              <p className="text-gray-600">by {book.author}</p>
              {book.isbn && (
                <p className="text-sm text-gray-500">ISBN: {book.isbn}</p>
              )}
            </div>
          </div>
        </div>

        {getModalContent()}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              buttonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowModal;
