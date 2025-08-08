import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const StorePage = () => {
  const { storeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Get store data from navigation state or fetch it
  const [store, setStore] = useState(location.state || null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    priceMin: '',
    priceMax: '',
    sortBy: 'newest'
  });

  // Fetch store details if not available from navigation state
  useEffect(() => {
    if (!store) {
      fetchStoreDetails();
    } else {
      setLoading(false);
    }
  }, [storeId, store]);

  // Fetch products when store is loaded
  useEffect(() => {
    if (store) {
      fetchStoreProducts();
    }
  }, [store, currentPage, filters]);

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/stores/${storeId}`);
      const data = await response.json();
      
      if (data.success) {
        setStore(data.store);
      } else {
        setError('Store not found');
      }
    } catch (err) {
      setError('Failed to load store details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProducts = async () => {
    try {
      setProductsLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 12,
        store_id: store.store_id || storeId,
        ...filters
      });

      const response = await fetch(`http://localhost:5000/api/products?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
        setTotalPages(data.total_pages || 1);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching store products:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAddToWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const loadingToast = toast.loading("Adding to wishlist...");

      const response = await fetch('http://localhost:5000/api/wishlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId })
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok && data.success) {
        if (data.already_exists) {
          toast.info(data.message);
        } else {
          toast.success(data.message);
        }
        window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      } else {
        toast.error(data.message || 'Failed to add to wishlist');
      }
    } catch (error) {
      toast.error('Failed to add to wishlist');
    }
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const loadingToast = toast.loading("Adding to cart...");

      const response = await fetch('http://localhost:5000/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          product_id: productId,
          quantity: 1 
        })
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok && data.success) {
        toast.success(data.message || 'Added to cart successfully!');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        toast.error(data.message || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const getProductImageUrl = (product) => {
    if (product.image_url) {
      if (product.image_url.startsWith("/uploads/")) {
        return `http://localhost:5000${product.image_url}`;
      }
      return product.image_url;
    }
    return "https://via.placeholder.com/300x300/f5e6d3/5e3023?text=No+Image";
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff9f5] py-12 px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
            <p className="text-[#8c5f53]">Loading store details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-[#fff9f5] py-12 px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4 max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Store Not Found</h3>
              <p className="text-sm">{error || 'The requested store could not be found.'}</p>
            </div>
            <Link
              to="/"
              className="px-6 py-2 bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9f5] py-12 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#8c5f53] mb-6">
          <Link to="/" className="hover:text-[#5e3023] transition-colors">Home</Link>
          <span>›</span>
          <Link to="/#stores" className="hover:text-[#5e3023] transition-colors">Stores</Link>
          <span>›</span>
          <span className="text-[#5e3023] font-medium">{store.name}</span>
        </div>

        {/* Store Header */}
        <div className="bg-white rounded-xl shadow-md border border-[#e7dcca] overflow-hidden mb-8">
          <div className="md:flex">
            {/* Store Image */}
            <div className="md:w-1/3">
              <img
                src={store.image}
                alt={store.name}
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
            
            {/* Store Info */}
            <div className="md:w-2/3 p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-[#5e3023] mb-2">{store.name}</h1>
                  <div className="flex items-center gap-4 text-[#8c5f53] mb-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>{store.location}</span>
                    </div>
                    {store.phone && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                        <span>{store.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Store Actions */}
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] rounded-lg transition-colors text-sm font-medium"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(store.location)}`, '_blank')}
                  >
                    📍 Directions
                  </button>
                  {store.phone && (
                    <button 
                      className="px-4 py-2 bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-lg transition-colors text-sm font-medium"
                      onClick={() => window.open(`tel:${store.phone}`, '_self')}
                    >
                      📞 Call
                    </button>
                  )}
                </div>
              </div>
              
              {/* Store Description */}
              <p className="text-[#8c5f53] leading-relaxed mb-6">
                {store.description || `Welcome to ${store.name}! We offer the finest selection of freshly baked goods, custom cakes, and delicious treats. Our skilled bakers use only the highest quality ingredients to create memorable experiences for every occasion.`}
              </p>
              
              {/* Store Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#e7dcca]">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#d3756b]">{products.length}+</div>
                  <div className="text-sm text-[#8c5f53]">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#d3756b]">⭐ 4.8</div>
                  <div className="text-sm text-[#8c5f53]">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#d3756b]">🚚 Fast</div>
                  <div className="text-sm text-[#8c5f53]">Delivery</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-md border border-[#e7dcca] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#5e3023]">Products from {store.name}</h2>
            <div className="flex items-center gap-4">
              {/* Sort Filter */}
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="px-3 py-2 border border-[#e7dcca] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d3756b] focus:border-transparent text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
              <p className="text-[#8c5f53]">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-[#e7dcca]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#5e3023] mb-2">No Products Available</h3>
              <p className="text-[#8c5f53] mb-4">This store hasn't added any products yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.product_id}
                    className="bg-[#fff9f5] rounded-lg shadow-sm border border-[#e7dcca] overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x300/f5e6d3/5e3023?text=No+Image";
                        }}
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.is_featured && (
                          <span className="bg-[#d3756b] text-white text-xs px-2 py-1 rounded-full font-medium">
                            ⭐ Featured
                          </span>
                        )}
                        {product.sale_price && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            🏷️ Sale
                          </span>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleAddToWishlist(product.product_id)}
                          className="w-8 h-8 bg-white/90 hover:bg-white text-[#d3756b] rounded-full flex items-center justify-center transition-colors"
                          title="Add to Wishlist"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </button>
                        <Link
                          to={`/product/${product.product_id}`}
                          className="w-8 h-8 bg-white/90 hover:bg-white text-[#5e3023] rounded-full flex items-center justify-center transition-colors"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-[#5e3023] mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-[#8c5f53] text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Price and Stock */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {product.sale_price ? (
                            <>
                              <span className="text-xl font-bold text-[#d3756b]">
                                {formatPrice(product.sale_price)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-[#5e3023]">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                        <div>
                          {product.stock_quantity > 0 ? (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              ✅ In Stock ({product.stock_quantity})
                            </span>
                          ) : (
                            <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                              ❌ Out of Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product.product_id)}
                          disabled={product.stock_quantity <= 0}
                          className="flex-1 bg-[#d3756b] hover:bg-[#c25d52] text-white py-2 px-3 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          {product.stock_quantity > 0 ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Add to Cart
                            </>
                          ) : (
                            'Out of Stock'
                          )}
                        </button>
                        <Link
                          to={`/product/${product.product_id}`}
                          className="px-3 py-2 bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] rounded-lg transition-colors font-medium text-sm flex items-center justify-center"
                        >
                          👁️ View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-[#e7dcca] rounded-lg hover:bg-[#f8e8e0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-[#d3756b] text-white'
                          : 'border border-[#e7dcca] hover:bg-[#f8e8e0]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-[#e7dcca] rounded-lg hover:bg-[#f8e8e0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back to Stores */}
        <div className="text-center mt-8">
          <Link
            to="/#stores"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5e3023] hover:bg-[#4a241b] text-white rounded-lg transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Stores
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StorePage;