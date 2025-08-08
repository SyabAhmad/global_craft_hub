import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { cartService } from "../services/cartService";
import { toast } from 'react-toastify';
import OwnStoreModal from './OwnStoreModal';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isOwnProduct, setIsOwnProduct] = useState(false);
  const [showOwnStoreModal, setShowOwnStoreModal] = useState(false);

  // Helper function to get product image URL
  const getProductImageUrl = (product) => {
    // Check if product has image_url (from primary image in product_images table)
    if (product.image_url) {
      // If it's a relative path, make it absolute
      if (product.image_url.startsWith("/uploads/")) {
        return `http://localhost:5000${product.image_url}`;
      }
      return product.image_url;
    }

    // Fallback to placeholder
    return "https://via.placeholder.com/300x300/f5e6d3/5e3023?text=No+Image";
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(price).replace('LKR', 'Rs.');
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${productId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success && data.product) {
          console.log("Product data received:", data.product);
          console.log("Raw image_url:", data.product.image_url);
          console.log("Processed image URL:", getProductImageUrl(data.product));
          setProduct(data.product);
        } else {
          throw new Error(data.message || "Product not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching product:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [productId]);

  useEffect(() => {
    const checkOwnership = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.role === 'supplier' && product) {
        try {
          const token = localStorage.getItem('token');
          const storeCheckResponse = await fetch('http://localhost:5000/api/stores/check', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (storeCheckResponse.ok) {
            const storeData = await storeCheckResponse.json();
            if (storeData.success && storeData.store && storeData.store.store_id === product.store_id) {
              setIsOwnProduct(true);
            }
          }
        } catch (error) {
          console.error('Error checking ownership:', error);
        }
      }
    };
    
    if (product) {
      checkOwnership();
    }
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to add items to cart');
        navigate('/login');
        return;
      }
      
      // Check if user is a supplier trying to add their own product
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.role === 'supplier') {
        // Check if this product belongs to the current user's store
        const storeCheckResponse = await fetch('http://localhost:5000/api/stores/check', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (storeCheckResponse.ok) {
          const storeData = await storeCheckResponse.json();
          if (storeData.success && storeData.store && storeData.store.store_id === product.store_id) {
            toast.error('You cannot add your own products to cart. This is your store!');
            return;
          }
        }
      }
      
      if (product.stock_quantity <= 0) {
        toast.error('This product is currently out of stock');
        return;
      }
      
      // Show loading toast
      const loadingToast = toast.loading("Adding to cart...");
      
      // Use the cart service
      const response = await cartService.addToCart(product.product_id, quantity);
      
      if (response.success) {
        toast.dismiss(loadingToast);
        toast.success(response.message || `${quantity} ${product.name}(s) added to cart!`);
        
        // Dispatch event to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.dismiss(loadingToast);
        toast.error(response.message || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.message || 'Failed to add item to cart');
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to add items to wishlist');
        navigate('/login');
        return;
      }
      
      // Show loading toast
      const loadingToast = toast.loading("Adding to wishlist...");
      
      const response = await fetch('http://localhost:5000/api/wishlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.product_id
        })
      });
      
      const data = await response.json();
      
      toast.dismiss(loadingToast);
      
      if (response.ok && data.success) {
        if (data.already_exists) {
          toast.info(data.message || 'Product is already in your wishlist!');
        } else {
          toast.success(data.message || 'Product added to wishlist!');
        }
        // Dispatch event to update wishlist count in navbar
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      } else {
        toast.error(data.message || 'Failed to add to wishlist');
        console.error('Wishlist API Error:', data);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const handleProceedToPayment = async () => {
    if (!product) return;
    
    // Check if user is a supplier trying to buy their own product
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.role === 'supplier') {
      try {
        const token = localStorage.getItem('token');
        const storeCheckResponse = await fetch('http://localhost:5000/api/stores/check', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (storeCheckResponse.ok) {
          const storeData = await storeCheckResponse.json();
          if (storeData.success && storeData.store && storeData.store.store_id === product.store_id) {
            // Show the modal instead of proceeding
            setShowOwnStoreModal(true);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking store ownership:', error);
        toast.error('Error checking store information');
        return;
      }
    }
    
    if (product.stock_quantity <= 0) {
      toast.error('This product is currently out of stock');
      return;
    }
    
    const order = { ...product, quantity, product_id: product.product_id };
    navigate("/payment", { state: { order } });
  };

  const handleQuantityChange = (value) => {
    const maxQuantity = product?.stock_quantity || 1;
    setQuantity(Math.max(1, Math.min(value, maxQuantity)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fff9f5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
          <p className="text-[#8c5f53] text-lg">Loading delicious product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fff9f5]">
        <div className="text-center bg-white rounded-xl shadow-md border border-[#e7dcca] p-6 max-w-md">
          <h3 className="text-xl font-semibold text-[#5e3023] mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-[#8c5f53] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fff9f5]">
        <div className="text-center bg-white rounded-xl shadow-md border border-[#e7dcca] p-6 max-w-md">
          <svg
            className="mx-auto h-16 w-16 text-[#e7dcca] mb-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-xl font-semibold text-[#5e3023] mb-2">
            Product not found
          </h3>
          <p className="text-[#8c5f53]">
            The product you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9f5] py-8 px-4">
      <div className="container mx-auto max-w-6xl mt-16">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e7dcca] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-[#f8f9fa] border border-[#e7dcca]">
                <img
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    console.log("Image failed to load:", e.target.src);
                    e.target.src = "/placeholder-product.jpg";
                  }}
                />
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-[#5e3023] mb-2">
                  {product.name}
                </h1>
                <p className="text-[#8c5f53] text-lg leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Product Details */}
              <div className="bg-[#fff9f5] rounded-lg p-4">
                <h3 className="font-semibold text-[#5e3023] mb-2">Product Details</h3>
                <ul className="text-[#8c5f53] space-y-1">
                  <li>Category: {product.category_name || "Desserts"}</li>
                  <li>Store: {product.store_name || "Sweet Delights"}</li>
                  <li>
                    Shipping:{" "}
                    {product.shippingInfo ||
                      "Free shipping on orders over Rs. 500"}
                  </li>
                </ul>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                {product.sale_price ? (
                  <>
                    <span className="text-2xl font-bold text-[#d3756b]">
                      {formatPrice(product.sale_price)}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                      {Math.round(((product.price - product.sale_price) / product.price) * 100)}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#5e3023]">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              {/* Stock Indicator */}
              {product.stock_quantity !== undefined && (
                <div>
                  {product.stock_quantity > 0 ? (
                    <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      ✓ {product.stock_quantity} in stock
                    </span>
                  ) : (
                    <span className="text-sm text-red-500 bg-red-50 px-3 py-1 rounded-full">
                      ✗ Out of stock
                    </span>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#5e3023]">
                  Quantity
                </label>
                <div className="flex items-center border border-[#e7dcca] rounded-lg overflow-hidden w-32">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-4 py-2 text-[#5e3023] hover:bg-[#f5e6d3] transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-16 text-center border-none focus:ring-0 py-2 text-[#5e3023]"
                    min="1"
                    max={product.stock_quantity || undefined}
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-4 py-2 text-[#5e3023] hover:bg-[#f5e6d3] transition-colors"
                    disabled={product.stock_quantity <= quantity}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {isOwnProduct ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <svg className="w-8 h-8 text-blue-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-semibold text-blue-700 mb-1">This is Your Product</h3>
                    <p className="text-blue-600 text-sm">You cannot purchase products from your own store.</p>
                    <Link
                      to="/manage-products"
                      className="inline-block mt-3 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Manage Your Products &rarr;
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-[#d3756b] text-white py-3 rounded-lg hover:bg-[#c25d52] transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={product.stock_quantity <= 0}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add to Cart
                      </button>
                      <button
                        onClick={handleProceedToPayment}
                        className="flex-1 bg-[#5e3023] text-white py-3 rounded-lg hover:bg-[#4a241b] transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={product.stock_quantity <= 0}
                      >
                        Buy Now
                      </button>
                    </div>
                    
                    <button
                      onClick={handleAddToWishlist}
                      className="w-full bg-white text-[#d3756b] border-2 border-[#d3756b] py-3 rounded-lg hover:bg-[#d3756b] hover:text-white transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      Add to Wishlist
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Own Store Modal */}
      <OwnStoreModal
        isOpen={showOwnStoreModal}
        onClose={() => setShowOwnStoreModal(false)}
        onManageProducts={() => {
          setShowOwnStoreModal(false);
          navigate('/manage-products');
        }}
        onBrowseProducts={() => {
          setShowOwnStoreModal(false);
          navigate('/products');
        }}
      />
    </div>
  );
};

export default ProductDetails;
