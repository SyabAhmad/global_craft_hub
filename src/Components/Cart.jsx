import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Cart = () => {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      loadCartItems();
    } else {
      setLoading(false);
    }

    // Listen for cart updates
    const handleCartUpdate = () => {
      if (isAuthenticated) {
        loadCartItems();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [isAuthenticated]);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      console.log('DEBUG: Loading cart from API');
      
      const response = await fetch('http://localhost:5000/api/cart/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('DEBUG: Cart API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG: Cart data received:', data);
        
        if (data.success) {
          setCartData(data.cart);
        } else {
          console.error('Cart API error:', data.message);
          setCartData({ items: [], total_items: 0, total_amount: 0 });
        }
      } else {
        console.error('Failed to load cart:', response.status);
        setCartData({ items: [], total_items: 0, total_amount: 0 });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartData({ items: [], total_items: 0, total_amount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(cartItemId);
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/cart/items/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Reload cart data
        await loadCartItems();
        toast.success('Quantity updated');
      } else {
        toast.error(data.message || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/cart/items/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Reload cart data
        await loadCartItems();
        toast.success('Item removed from cart');
        
        // Dispatch event to update navbar cart count
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error(data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/cart/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCartData({ items: [], total_items: 0, total_amount: 0 });
        toast.success('Cart cleared');
        
        // Dispatch event to update navbar cart count
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error(data.message || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const getTotalPrice = () => {
    return cartData?.total_amount || 0;
  };

  const getTotalItems = () => {
    return cartData?.total_items || 0;
  };

  const getCartItems = () => {
    return cartData?.items || [];
  };

  const handleCheckout = () => {
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    if (!currentUser) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }

    // Navigate to checkout/payment page
    navigate('/payment', { 
      state: { 
        cartItems,
        totalAmount: getTotalPrice()
      }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(price).replace('LKR', 'Rs.');
  };

  const getProductImageUrl = (item) => {
    if (item.image_url) {
      if (item.image_url.startsWith("/uploads/")) {
        return `http://localhost:5000${item.image_url}`;
      }
      return item.image_url;
    }
    return '/placeholder-product.jpg';
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fff9f5] py-8 px-4 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-md border border-[#e7dcca] p-8 max-w-md">
          <h2 className="text-2xl font-bold text-[#5e3023] mb-4">Please Log In</h2>
          <p className="text-[#8c5f53] mb-6">You need to be logged in to view your cart.</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-3 rounded-lg transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] px-6 py-3 rounded-lg transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff9f5] py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
          <p className="text-[#8c5f53]">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const cartItems = getCartItems();

  return (
    <div className="min-h-screen bg-[#fff9f5] py-8 px-4">
      <div className="container mx-auto max-w-6xl mt-16">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#e7dcca]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#5e3023] mb-2">Shopping Cart</h1>
              <p className="text-xl text-[#8c5f53]">
                {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart
              </p>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#e7dcca]">
            <div className="mb-8">
              <svg
                className="w-24 h-24 text-[#e7dcca] mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h4a1 1 0 0 1 0 2h-1v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6H3a1 1 0 1 1 0-2h4zM6 6v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6H6zm8-2V3H8v1h6z"/>
              </svg>
              <h2 className="text-2xl font-bold text-[#5e3023] mb-2">Your cart is empty</h2>
              <p className="text-[#8c5f53] mb-6">
                Looks like you haven't added any items to your cart yet.
              </p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-[#e7dcca] overflow-hidden">
                <div className="p-6 border-b border-[#e7dcca]">
                  <h2 className="text-2xl font-bold text-[#5e3023]">Cart Items</h2>
                </div>
                <div className="divide-y divide-[#e7dcca]">
                  {cartItems.map((item) => (
                    <div key={item.cart_item_id} className="p-6 flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={getProductImageUrl(item)}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg border border-[#e7dcca]"
                          onError={(e) => {
                            e.target.src = '/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#5e3023] truncate">
                          {item.name}
                        </h3>
                        <p className="text-[#8c5f53] text-sm truncate">
                          {item.store_name && `From ${item.store_name}`}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {item.sale_price ? (
                            <>
                              <span className="text-lg font-bold text-[#d3756b]">
                                {formatPrice(item.sale_price)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(item.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-[#5e3023]">
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                          disabled={updating}
                          className="w-8 h-8 bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] rounded-full flex items-center justify-center font-bold transition-colors disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold text-[#5e3023]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          disabled={updating || item.quantity >= item.stock_quantity}
                          className="w-8 h-8 bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] rounded-full flex items-center justify-center font-bold transition-colors disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      
                      {/* Item Total */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#5e3023]">
                          {formatPrice(item.item_total)}
                        </div>
                        <button
                          onClick={() => removeItem(item.cart_item_id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium mt-1 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-[#e7dcca] p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-[#5e3023] mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-[#8c5f53]">Subtotal ({getTotalItems()} items)</span>
                    <span className="font-semibold text-[#5e3023]">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c5f53]">Delivery Fee</span>
                    <span className="font-semibold text-[#5e3023]">
                      {formatPrice(200)} {/* Fixed delivery fee */}
                    </span>
                  </div>
                  <div className="border-t border-[#e7dcca] pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-[#5e3023]">Total</span>
                      <span className="text-[#d3756b]">
                        {formatPrice(getTotalPrice() + 200)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white py-3 px-6 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Proceed to Checkout
                </button>
                
                <button
                  onClick={() => navigate('/products')}
                  className="w-full mt-3 bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] py-2 px-6 rounded-full font-medium transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;