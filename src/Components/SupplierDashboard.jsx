import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Supplier dashboard component
const SupplierDashboard = () => {
    const { currentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [hasStore, setHasStore] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [productStats, setProductStats] = useState({
      total_products: 0,
      active_products: 0,
      featured_products: 0,
      out_of_stock: 0,
      low_stock: 0,
      total_value: 0,
      avg_price: 0
    });
    const [orderStats, setOrderStats] = useState({
      total_orders: 0,
      pending_orders: 0,
      processing_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0,
      total_revenue: 0,
      orders_today: 0
    });
    const [storeInfo, setStoreInfo] = useState(null);
    
    // Show loading if not authenticated or user data not loaded
    if (!isAuthenticated || !currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#fff9f5] to-[#f5e6d3] py-8 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
                    <p className="text-[#8c5f53]">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
      // Check if user has a store and get store info
      const checkStore = async () => {
        try {
          setIsLoading(true);
          
          const response = await fetch('http://localhost:5000/api/stores/check', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) {
            console.error("Store check error status:", response.status);
            // For new users, we should assume they have a store since it's created during signup
            setHasStore(true);
            return;
          }
          
          const data = await response.json();
          console.log("Store check response:", data);
          setHasStore(data.hasStore);
          
          if (data.hasStore && data.store) {
            setStoreInfo(data.store);
          }
          
        } catch (err) {
          console.error("Error checking store:", err);
          // For new users, assume they have a store
          setHasStore(true);
        } finally {
          setIsLoading(false);
        }
      };
      
      checkStore();
    }, []);

    useEffect(() => {
      const fetchStats = async () => {
        if (!hasStore) return;
        
        try {
          const token = localStorage.getItem('token');
          const headers = { 'Authorization': `Bearer ${token}` };
          
          // Fetch product stats
          const productResponse = await fetch('http://localhost:5000/api/products/stats', { headers });
          if (productResponse.ok) {
            const productData = await productResponse.json();
            if (productData.success) {
              setProductStats(productData.stats);
            }
          }
          
          // Fetch order stats
          const orderResponse = await fetch('http://localhost:5000/api/orders/stats', { headers });
          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            if (orderData.success) {
              setOrderStats(orderData.stats);
            }
          }
        } catch (err) {
          console.error("Error fetching stats:", err);
        }
      };
      
      fetchStats();
    }, [hasStore]);

    const handleAddProduct = () => {
        navigate('/add-product');
    };

    const handleManageProducts = () => {
        navigate('/manage-products');
    };

    const handleManageOrders = () => {
        navigate('/manage-orders');
    };

    const handleStoreSettings = () => {
        navigate('/store-settings');
    };

    const handleCreateStore = () => {
        navigate('/create-store');
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(amount).replace('LKR', 'Rs.');
    };

    // Calculate stock health percentage
    const getStockHealthPercentage = () => {
        if (productStats.total_products === 0) return 0;
        const healthyStock = productStats.total_products - productStats.out_of_stock - productStats.low_stock;
        return Math.round((healthyStock / productStats.total_products) * 100);
    };

    // In your render logic:
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff9f5] to-[#f5e6d3] py-8 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
            <p className="text-[#8c5f53]">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    // Since stores are created during signup, this case should rarely happen
    // But we'll keep it as a fallback
    if (!hasStore) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff9f5] to-[#f5e6d3] py-8 px-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#e7dcca] max-w-md w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#d3756b] to-[#c25d52] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-[#5e3023] mb-4">Store Setup Issue</h1>
            <p className="text-[#8c5f53] mb-6">
              It looks like there was an issue setting up your store. Don't worry, let's get this fixed!
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleCreateStore}
                className="w-full bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Store
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-[#e7dcca] to-[#d3c2a8] text-[#5e3023] font-medium py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Refresh Page
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-[#e7dcca] text-left">
              <h3 className="text-sm font-medium text-[#5e3023] mb-2">Need help?</h3>
              <p className="text-sm text-[#8c5f53]">
                If you continue to have issues, please contact our support team and we'll help you get your store set up.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fff9f5] to-[#f5e6d3] py-8 px-4">
            <div className="container mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#e7dcca] mt-16">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-[#5e3023] mb-2">
                                Supplier Dashboard
                            </h1>
                            <p className="text-xl text-[#8c5f53]">
                                Welcome back, {storeInfo?.name || currentUser?.business_name || `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || 'Supplier'}!
                            </p>
                            <div className="mt-2 text-sm text-gray-500">
                                <p>Email: {currentUser?.email}</p>
                                <p>Role: {currentUser?.role}</p>
                                {storeInfo && (
                                  <>
                                    <p>Store: {storeInfo.name}</p>
                                    <p>Location: {storeInfo.city}</p>
                                  </>
                                )}
                                <p className={`text-sm ${currentUser?.is_verified ? 'text-green-600' : 'text-red-500'}`}>
                                  Verified: {currentUser?.is_verified ? 'Yes' : 'No'}
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#8c7c68] to-[#8c7c68] rounded-full flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">
                                    {(storeInfo?.name || currentUser?.business_name || currentUser?.first_name || 'U').charAt(0).toUpperCase()
}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Store Status Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#e7dcca] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#5e3023]">Store Status</h2>
                            <div className="w-12 h-12 bg-gradient-to-br from-[#fff9f5] to-[#e7dcca] rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#d3756b]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[#8c5f53]">Verification Status:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    currentUser?.is_verified 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {currentUser?.is_verified ? 'Verified' : 'Pending'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[#8c5f53]">Total Revenue:</span>
                                <span className="text-lg font-bold text-[#d3756b]">
                                    {formatCurrency(orderStats.total_revenue)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[#8c5f53]">Store Value:</span>
                                <span className="text-lg font-bold text-[#5e3023]">
                                    {formatCurrency(productStats.total_value)}
                                </span>
                            </div>
                            <button 
                                onClick={handleStoreSettings}
                                className="w-full mt-4 bg-gradient-to-r from-[#8c7c68] to-[#c25d52] text-white py-2 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                            >
                                Manage Store
                            </button>
                        </div>
                    </div>
                    
                    {/* Orders Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#e7dcca] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#5e3023]">Orders</h2>
                            <div className="w-12 h-12 bg-gradient-to-br from-[#fff9f5] to-[#e7dcca] rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#d3756b]" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[#8c5f53]">New orders:</span>
                                <span className="text-2xl font-bold text-[#d3756b]">{orderStats.pending_orders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#8c5f53]">Processing:</span>
                                <span className="text-xl font-bold text-[#f59e0b]">{orderStats.processing_orders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#8c5f53]">Completed:</span>
                                <span className="text-lg font-semibold text-green-600">{orderStats.completed_orders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#8c5f53]">Today:</span>
                                <span className="text-lg font-semibold text-[#5e3023]">{orderStats.orders_today}</span>
                            </div>
                            <button 
                                onClick={handleManageOrders}
                                className="w-full mt-4 bg-gradient-to-r from-[#e7dcca] to-[#8c7c68] text-white py-2 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                            >
                                Manage Orders
                            </button>
                        </div>
                    </div>
                    
                    {/* Products Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#e7dcca] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#5e3023]">Products</h2>
                            <div className="w-12 h-12 bg-gradient-to-br from-[#fff9f5] to-[#e7dcca] rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#d3756b]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[#8c5f53]">Total products:</span>
                                <span className="text-2xl font-bold text-[#5e3023]">{productStats.total_products}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#8c5f53]">Active:</span>
                              <span className="text-lg font-semibold text-green-600">{productStats.active_products}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#8c5f53]">Featured:</span>
                              <span className="text-lg font-semibold text-[#d3756b]">{productStats.featured_products}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#8c5f53]">Out of stock:</span>
                              <span className="text-lg font-semibold text-red-500">{productStats.out_of_stock}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#8c5f53]">Low stock:</span>
                              <span className="text-lg font-semibold text-amber-500">{productStats.low_stock}</span>
                            </div>
                            
                            {/* Stock Health Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-sm text-[#8c5f53] mb-1">
                                    <span>Stock Health</span>
                                    <span>{getStockHealthPercentage()}%</span>
                                </div>
                                <div className="w-full bg-[#f5e6d3] rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-[#d3756b] to-[#c25d52] h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${getStockHealthPercentage()}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleManageProducts}
                                className="w-full mt-4 bg-gradient-to-r from-[#8c7c68] to-[#d3c2a8] text-white py-2 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                            >
                                Manage Arts
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Quick Actions Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#e7dcca]">
                    <h2 className="text-2xl font-bold text-[#5e3023] mb-6 flex items-center">
                        <svg className="w-8 h-8 mr-3 text-[#d3756b]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onClick={handleAddProduct} className="group bg-gradient-to-r from-[#8c7c68] to-[#c25d52] text-white px-6 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add New Art
                        </button>
                        <button onClick={handleManageProducts} className="group bg-gradient-to-r from-[#e7dcca] to-[#d3c2a8] text-[#5e3023] px-6 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                            </svg>
                            View Art
                        </button>
                        <button onClick={handleStoreSettings} className="group bg-gradient-to-r from-[#fff9f5] to-[#f5e6d3] text-[#5e3023] px-6 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center border border-[#e7dcca]">
                            <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            Store Settings
                        </button>
                        <button onClick={handleManageOrders} className="group bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white px-6 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            Manage Orders
                        </button>
                    </div>
                </div>

                {/* Additional Insights Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Revenue Chart Placeholder */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#e7dcca]">
                        <h3 className="text-xl font-bold text-[#5e3023] mb-4">Revenue Overview</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-[#8c5f53]">Total Revenue:</span>
                                <span className="font-bold text-[#5e3023]">{formatCurrency(orderStats.total_revenue)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#8c5f53]">Average Product Price:</span>
                                <span className="font-bold text-[#d3756b]">{formatCurrency(productStats.avg_price)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#8c5f53]">Total Orders:</span>
                                <span className="font-bold text-[#5e3023]">{orderStats.total_orders}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#e7dcca]">
                        <h3 className="text-xl font-bold text-[#5e3023] mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-[#fff9f5] rounded-lg">
                                <div className="text-2xl font-bold text-[#d3756b]">{orderStats.orders_today}</div>
                                <div className="text-sm text-[#8c5f53]">Orders Today</div>
                            </div>
                            <div className="text-center p-4 bg-[#fff9f5] rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{productStats.active_products}</div>
                                <div className="text-sm text-[#8c5f53]">Active Products</div>
                            </div>
                            <div className="text-center p-4 bg-[#fff9f5] rounded-lg">
                                <div className="text-2xl font-bold text-amber-500">{productStats.low_stock}</div>
                                <div className="text-sm text-[#8c5f53]">Low Stock</div>
                            </div>
                            <div className="text-center p-4 bg-[#fff9f5] rounded-lg">
                                <div className="text-2xl font-bold text-red-500">{productStats.out_of_stock}</div>
                                <div className="text-sm text-[#8c5f53]">Out of Stock</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierDashboard;