import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with base config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add auth token to requests
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  // Customer signup
  registerCustomer: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register/customer', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Supplier signup - Updated to use axios consistently
  registerSupplier: async (userData) => {
    try {
      console.log('Sending supplier registration data:', userData);
      
      const response = await apiClient.post('/auth/register/supplier', userData);
      
      console.log('Supplier registration response:', response.data);
      
      if (response.data.success && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Supplier registration error:', error);
      
      // Handle axios error structure
      if (error.response) {
        // Server responded with error status
        throw error.response.data;
      } else if (error.request) {
        // Request was made but no response received
        throw { message: 'Network error. Please check your connection.' };
      } else {
        // Something else happened
        throw { message: error.message || 'Registration failed' };
      }
    }
  },

  // Login for both customer and supplier
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user from token
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Verify if token is valid
  verifyToken: async () => {
    try {
      const response = await apiClient.get('/auth/verify-token');
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error.response ? error.response.data : error;
    }
  },

  // Request password reset
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Reset password with token
  resetPassword: async (token, password) => {
    try {
      const response = await apiClient.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  }
};

// Store Services
export const storeService = {
  // Check if user has a store
  checkStore: async () => {
    try {
      const response = await apiClient.get('/stores/check');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Create a new store
  createStore: async (storeData) => {
    try {
      const response = await apiClient.post('/stores/', storeData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get store details
  getStoreDetails: async (storeId) => {
    try {
      const response = await apiClient.get(`/stores/${storeId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Update store
  updateStore: async (storeId, storeData) => {
    try {
      const response = await apiClient.put(`/stores/${storeId}`, storeData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  }
};

export default apiClient;