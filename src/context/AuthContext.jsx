import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = async () => {
      try {
        // Get user from localStorage
        const user = authService.getCurrentUser();
        
        if (user) {
          // Verify token is still valid
          await authService.verifyToken();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        // Clear invalid token
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    // Don't navigate from context - let components handle navigation
  };

  const registerCustomer = async (userData) => {
    try {
      const response = await authService.registerCustomer(userData);
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const registerSupplier = async (userData) => {
    try {
      const response = await authService.registerSupplier(userData);
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateUser = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    registerCustomer,
    registerSupplier,
    updateUser,
    isAuthenticated: !!currentUser,
    isSupplier: currentUser?.role === 'supplier',
    isCustomer: currentUser?.role === 'customer',
    isAdmin: currentUser?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};