import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/api';
// import BakeHouseImage from '../assets/BakeHouse.png';

const StoreDetails = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('StoreDetails component mounted with storeId:', storeId);
    
    if (storeId) {
      fetchStoreDetails();
      fetchStoreProducts();
  // track store view
  analyticsService.trackEvent({ event_type: 'view', store_id: storeId });
    } else {
      console.error('No storeId provided');
      setError('No store ID provided');
      setLoading(false);
    }
  }, [storeId]);

  const fetchStoreDetails = async () => {
    try {
      console.log('Fetching store details for ID:', storeId);
      const response = await fetch(`http://localhost:5000/api/stores/${storeId}`);
      console.log('Store details response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Store details response data:', data);
        
        if (data.success && data.store) {
          setStore(data.store);
          console.log('Store data set successfully:', data.store);
        } else {
          console.error('Store API returned success=false or no store data:', data);
          setError(data.message || 'Failed to fetch store details');
        }
      } else {
        console.error('Store details API failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setError(`Failed to fetch store details (${response.status})`);
      }
    } catch (err) {
      console.error('Error fetching store details:', err);
      setError('Error loading store details: ' + err.message);
    }
  };

  const fetchStoreProducts = async () => {
    try {
      console.log('Fetching products for store ID:', storeId);
      const response = await fetch(`http://localhost:5000/api/products?store_id=${storeId}`);
      console.log('Products response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Products response data:', data);
        
        if (data.success) {
          setProducts(data.products || []);
          console.log('Products set successfully:', data.products?.length || 0, 'products');
        } else {
          console.error('Products API returned success=false:', data);
          setProducts([]);
        }
      } else {
        console.error('Products API failed with status:', response.status);
        const errorText = await response.text();
        console.error('Products error response:', errorText);
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

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
  return null;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price).replace('PKR', 'Rs.');
  };

  console.log('Render state:', { loading, error, store: !!store, productsCount: products.length });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff9f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto"></div>
          <p className="mt-4 text-[#8c5f53]">Loading store details...</p>
          <p className="mt-2 text-sm text-[#8c5f53]">Store ID: {storeId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fff9f5] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-[#5e3023] mb-4">Error</h2>
          <p className="text-[#8c5f53] mb-4">{error}</p>
          <p className="text-sm text-[#8c5f53] mb-6">Store ID: {storeId}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-2 rounded-lg transition-colors mr-3"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[#fff9f5] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#5e3023] mb-4">Store Not Found</h2>
          <p className="text-[#8c5f53] mb-4">The store you're looking for doesn't exist.</p>
          <p className="text-sm text-[#8c5f53] mb-6">Store ID: {storeId}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9f5] py-8 ">
      {/* Store Header */}
      <div className="max-w-6xl mx-auto px-4 mb-8 mt-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Store Banner */}
          <div className="h-64 relative">
            <img
              src={store.hero_image_url}
              alt={store.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2">{store.name}</h1>
              <p className="text-lg opacity-90">📍 {store.city || store.address}</p>
            </div>
          </div>

          {/* Store Info */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-[#5e3023] mb-4">About This Store</h2>
                <p className="text-[#8c5f53] leading-relaxed mb-4">
                  {store.description || `Welcome to ${store.name}! We specialize in creating delicious baked goods with love and care.`}
                </p>
                
                {store.address && (
                  <div className="flex items-center text-[#8c5f53] mb-2">
                    <span className="font-semibold mr-2">📍 Address:</span>
                    <span>{store.address}</span>
                  </div>
                )}
                
                {store.phone && (
                  <div className="flex items-center text-[#8c5f53] mb-2">
                    <span className="font-semibold mr-2">📞 Phone:</span>
                    <span>{store.phone}</span>
                  </div>
                )}
                
                {store.email && (
                  <div className="flex items-center text-[#8c5f53] mb-2">
                    <span className="font-semibold mr-2">📧 Email:</span>
                    <span>{store.email}</span>
                  </div>
                )}
                
                <div className="flex items-center text-[#8c5f53] mb-2">
                  <span className="font-semibold mr-2">⭐ Rating:</span>
                  <span>{store.avg_rating ? parseFloat(store.avg_rating).toFixed(1) : '5.0'} / 5.0</span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#5e3023] mb-4">Opening Hours</h2>
                {store.opening_hours && typeof store.opening_hours === 'object' ? (
                  <div className="space-y-2">
                    {Object.entries(store.opening_hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between text-[#8c5f53]">
                        <span className="font-medium capitalize">{day}:</span>
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[#8c5f53] space-y-1">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: 10:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Products */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-[#5e3023]">Our Products</h2>
          <span className="text-[#8c5f53]">{products.length} products available</span>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.product_id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/product/${product.product_id}`)}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-bold text-[#5e3023] mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-[#8c5f53] text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    {product.sale_price ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-[#d3756b]">
                          {formatPrice(product.sale_price)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-[#5e3023]">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-[#8c5f53] mb-3">
                    <span>Stock: {product.stock_quantity}</span>
                    {product.is_featured && (
                      <span className="bg-[#d3756b] text-white px-2 py-1 rounded-full text-xs">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <button
                    className="w-full bg-[#d3756b] hover:bg-[#c25d52] text-white py-2 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      analyticsService.trackEvent({ event_type: 'click', store_id: storeId, product_id: product.product_id });
                      navigate(`/product/${product.product_id}`);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#8c5f53] mb-4">No products available at this store yet.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse Other Stores
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDetails;