import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cartService } from "../services/cartService";
import { toast } from 'react-toastify';

const Wishlist = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch wishlist from API
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchWishlist = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        console.log('DEBUG: Fetching wishlist with token:', token ? 'present' : 'missing');
        
        // Try without trailing slash first
        const response = await fetch('http://localhost:5000/api/wishlist', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('DEBUG: Wishlist response status:', response.status);
        console.log('DEBUG: Wishlist response ok:', response.ok);
        console.log('DEBUG: Response URL:', response.url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('DEBUG: Error response text:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('DEBUG: Wishlist data received:', data);
        
        if (data.success) {
          setWishlistItems(data.items || []);
          console.log('DEBUG: Set wishlist items:', data.items?.length || 0);
        } else {
          throw new Error(data.message || 'Failed to fetch wishlist');
        }
        
      } catch (err) {
        console.error('Error fetching wishlist:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  // Helper functions
  const getProductImageUrl = (product) => {
    if (product.image_url && product.image_url.trim() !== '') {
      if (product.image_url.startsWith("/uploads/")) {
        return `http://localhost:5000${product.image_url}`;
      }
      if (product.image_url.startsWith("http")) {
        return product.image_url;
      }
      return `http://localhost:5000/${product.image_url}`;
    }
    return `/placeholder-product.jpg`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("LKR", "Rs.");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleRemoveFromWishlist = async (itemId) => {
    try {
      console.log('DEBUG: Starting remove for item ID:', itemId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to remove items from wishlist');
        return;
      }
      
      // Show loading toast
      const loadingToast = toast.loading("Removing from wishlist...");
      
      console.log('DEBUG: Making DELETE request to:', `http://localhost:5000/api/wishlist/remove/${itemId}`);
      
      const response = await fetch(`http://localhost:5000/api/wishlist/remove/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('DEBUG: Remove response status:', response.status);
      console.log('DEBUG: Remove response ok:', response.ok);
      
      const data = await response.json();
      console.log('DEBUG: Remove response data:', data);
      
      toast.dismiss(loadingToast);
      
      if (response.ok && data.success) {
        // Update local state - remove the item from the list
        setWishlistItems(prev => {
          const updated = prev.filter(item => item.wishlist_item_id !== itemId);
          console.log('DEBUG: Updated wishlist items count:', updated.length);
          return updated;
        });
        
        toast.success(data.message || 'Item removed from wishlist');
        
        // Dispatch event to update navbar count
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      } else {
        console.error('DEBUG: Remove failed with data:', data);
        toast.error(data.message || 'Failed to remove item from wishlist');
      }
      
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
      toast.error('Failed to remove item from wishlist');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to add items to cart');
        navigate('/login');
        return;
      }
      
      console.log('DEBUG: Adding to cart:', product);
      
      // Show loading toast
      const loadingToast = toast.loading("Adding to cart...");

      const response = await fetch('http://localhost:5000/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.product_id,
          quantity: 1 // Default quantity for wishlist to cart
        })
      });

      console.log('DEBUG: Cart response status:', response.status);
      const data = await response.json();
      console.log('DEBUG: Cart response data:', data);

      toast.dismiss(loadingToast);

      if (response.ok && data.success) {
        toast.success(data.message || 'Product added to cart successfully!');
        
        // Dispatch event to update cart count in navbar
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Optionally remove from wishlist after adding to cart
        // await handleRemoveFromWishlist(product.wishlist_item_id);
      } else {
        toast.error(data.message || 'Failed to add product to cart');
        console.error('Cart API Error:', data);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Are you sure you want to clear your entire wishlist?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wishlist/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setWishlistItems([]);
        toast.success('Wishlist cleared');
        
        // Dispatch event to update navbar count
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      } else {
        toast.error(data.message || 'Failed to clear wishlist');
      }
      
    } catch (err) {
      console.error("Failed to clear wishlist:", err);
      toast.error('Failed to clear wishlist');
    }
  };

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fff9f5] py-12 px-4 pt-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-md border border-[#e7dcca] p-8">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-[#e7dcca]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#5e3023] mb-4">
              Please Log In to View Your Wishlist
            </h2>
            <p className="text-[#8c5f53] mb-6">
              You need to be logged in to save and view your favorite products.
            </p>
            <div className="space-x-4">
              <Link
                to="/login"
                className="inline-block bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-3 rounded-lg transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="inline-block bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] px-6 py-3 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9f5] py-12 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-[#d3756b] rounded-full">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#5e3023]">My Wishlist</h1>
                <p className="text-[#8c5f53]">Your favorite bakery products</p>
              </div>
            </div>
            
            {/* Clear Wishlist Button */}
            {wishlistItems.length > 0 && (
              <button
                onClick={handleClearWishlist}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-[#8c5f53] mb-3">
            <span>👤 {currentUser?.first_name} {currentUser?.last_name}</span>
            <span>💝 {wishlistItems.length} items saved</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
            <p className="text-[#8c5f53]">Loading your wishlist...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4 max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Oops! Something went wrong</h3>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty Wishlist */}
        {!loading && !error && wishlistItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-[#e7dcca]">
            <div className="mb-6">
              <svg className="mx-auto h-20 w-20 text-[#e7dcca]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-[#5e3023] mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-[#8c5f53] mb-6 max-w-md mx-auto">
              Start exploring our delicious bakery products and save your favorites here. 
              Click the heart icon on any product to add it to your wishlist.
            </p>
            <Link
              to="/products"
              className="inline-block bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-3 rounded-lg transition-colors"
            >
              🍰 Browse Products
            </Link>
          </div>
        )}

        {/* Wishlist Items */}
        {!loading && !error && wishlistItems.length > 0 && (
          <div className="space-y-4">
            {/* Temporary test button - remove after testing
            <div className="bg-yellow-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Debug: Test remove function</p>
              {wishlistItems.map(item => (
                <button
                  key={item.wishlist_item_id}
                  onClick={() => {
                    console.log('TEST: Removing item:', item.wishlist_item_id);
                    handleRemoveFromWishlist(item.wishlist_item_id);
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded mr-2 text-sm"
                >
                  Test Remove {item.name.substring(0, 20)}...
                </button>
              ))}
            </div> */}
            
            {wishlistItems.map((item) => {
              console.log('DEBUG: Rendering item with ID:', item.wishlist_item_id);
              return (
                <div
                  key={item.wishlist_item_id}
                  className="bg-white rounded-xl shadow-md border border-[#e7dcca] overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row">
                    
                    {/* Product Image */}
                    <div className="md:w-64 h-48 md:h-auto relative">
                      <img
                        src={getProductImageUrl(item)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                      
                      {/* Featured Badge */}
                      {item.is_featured && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-[#d3756b] text-white text-xs px-2 py-1 rounded-full font-medium">
                            ⭐ Featured
                          </span>
                        </div>
                      )}

                      {/* Sale Badge */}
                      {item.sale_price && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            🏷️ Sale
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-[#5e3023] mb-2">
                            {item.name}
                          </h3>
                          <p className="text-[#8c5f53] mb-3 line-clamp-2">
                            {item.description}
                          </p>
                          
                          {/* Store and Category Info */}
                          <div className="flex items-center gap-4 text-sm text-[#8c5f53] mb-3">
                            <span className="flex items-center gap-1">
                              🏪 {item.store_name}
                            </span>
                            <span className="flex items-center gap-1">
                              📂 {item.category_name}
                            </span>
                            <span className="flex items-center gap-1">
                              📅 Added {formatDate(item.date_added)}
                            </span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('DEBUG: Remove button clicked for item:', item.wishlist_item_id);
                            handleRemoveFromWishlist(item.wishlist_item_id);
                          }}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors ml-4"
                          title="Remove from wishlist"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        </button>
                      </div>

                      {/* Price and Actions */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        
                        {/* Price */}
                        <div className="flex items-center gap-3">
                          {item.sale_price ? (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-[#d3756b]">
                                {formatPrice(item.sale_price)}
                              </span>
                              <span className="text-lg text-gray-500 line-through">
                                {formatPrice(item.price)}
                              </span>
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                                {Math.round(((item.price - item.sale_price) / item.price) * 100)}% OFF
                              </span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-[#5e3023]">
                              {formatPrice(item.price)}
                            </span>
                          )}
                          
                          {/* Stock Status */}
                          <div className="ml-2">
                            {item.stock_quantity > 0 ? (
                              <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                                ✅ In Stock ({item.stock_quantity})
                              </span>
                            ) : (
                              <span className="text-sm text-red-500 bg-red-50 px-2 py-1 rounded">
                                ❌ Out of Stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Link
                            to={`/product/${item.product_id}`}
                            className="px-4 py-2 bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] rounded-lg transition-colors text-sm font-medium"
                          >
                            👁️ View Details
                          </Link>
                          
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={item.stock_quantity <= 0}
                            className="px-4 py-2 bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {item.stock_quantity > 0 ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Add to Cart
                              </>
                            ) : (
                              '❌ Out of Stock'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Continue Shopping */}
            <div className="text-center py-8">
              <Link
                to="/products"
                className="inline-block bg-[#5e3023] hover:bg-[#4a241b] text-white px-6 py-3 rounded-lg transition-colors"
              >
                🍰 Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;