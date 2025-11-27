import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

// In-memory access token (do NOT persist)
let accessTokenMemory = null;

export const setAccessToken = (token) => {
  accessTokenMemory = token || null;
};

export const getAccessToken = () => accessTokenMemory;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = response.data;
          setAccessToken(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// Public/user book endpoints
export const booksAPI = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  searchBooks: (searchParams) => {
    const params = new URLSearchParams();

    if (searchParams.query) params.append('q', searchParams.query);
    if (searchParams.genre) params.append('genre', searchParams.genre);
    if (searchParams.author) params.append('author', searchParams.author);
    if (searchParams.yearFrom) params.append('yearFrom', searchParams.yearFrom);
    if (searchParams.yearTo) params.append('yearTo', searchParams.yearTo);
    if (searchParams.available !== '') params.append('available', searchParams.available);
    if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy);
    if (searchParams.sortOrder) params.append('sortOrder', searchParams.sortOrder);
    if (searchParams.page) params.append('page', searchParams.page);
    if (searchParams.limit) params.append('limit', searchParams.limit);

    return api.get(`/books/search?${params.toString()}`);
  },
  borrowBook: (bookId) => api.post(`/books/${bookId}/borrow`),
  reserveBook: (bookId) => api.post(`/books/${bookId}/reserve`),
  returnBook: (bookId) => api.post(`/books/${bookId}/return`),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  getBorrowHistory: (params) => api.get('/user/borrow-history', { params }),
  getActiveBorrows: () => api.get('/user/active-borrows'),
  getStats: () => api.get('/user/stats'),
  updateProfile: (data) => api.put('/user/profile', data),
  renewBook: (borrowId) => api.post(`/user/renew/${borrowId}`),
};

// Wishlist endpoints
export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (bookId) => api.post(`/wishlist/${bookId}`),
  removeFromWishlist: (bookId) => api.delete(`/wishlist/${bookId}`),
  checkInWishlist: (bookId) => api.get(`/wishlist/check/${bookId}`),
};

// Admin endpoints
export const adminAPI = {
  getAllBooks: (params) => api.get('/admin/books', { params }),
  createBook: (bookData) => api.post('/admin/books', bookData),
  updateBook: (id, bookData) => api.put(`/admin/books/${id}`, bookData),
  deleteBook: (id) => api.delete(`/admin/books/${id}`),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
};

export default api;
