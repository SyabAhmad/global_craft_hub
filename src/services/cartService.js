import apiClient from './api';

export const cartService = {
  // Get cart items
  getCart: async () => {
    try {
      const response = await apiClient.get('/cart/');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await apiClient.post('/cart/items', {
        product_id: productId,
        quantity: quantity
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Update cart item quantity
  updateCartItem: async (cartItemId, quantity) => {
    try {
      const response = await apiClient.put(`/cart/items/${cartItemId}`, {
        quantity: quantity
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Remove item from cart
  removeFromCart: async (cartItemId) => {
    try {
      const response = await apiClient.delete(`/cart/items/${cartItemId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const response = await apiClient.delete('/cart/');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Get cart item count
  getCartCount: async () => {
    try {
      const response = await apiClient.get('/cart/count');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  }
};