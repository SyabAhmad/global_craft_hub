import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManageProducts = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products/manage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
        }
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setProducts(products.map(product =>
          product.product_id === productId
            ? { ...product, status: newStatus, is_active: newStatus === 'active' }
            : product
        ));
      } else {
        alert('Failed to update product status');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Error updating product status');
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    // Enhanced confirmation dialog
    const confirmMessage = `Are you sure you want to delete "${productName}"?\n\nThis action will:\n• Remove the product permanently\n• Delete all associated images\n• Remove it from customer carts and wishlists\n• Delete all reviews\n\nThis cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Show loading state
      const loadingToast = toast.loading('Deleting product...');
      
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok && data.success) {
        setProducts(products.filter(product => product.product_id !== productId));
        toast.success(data.message || 'Product deleted successfully');
      } else {
        // Handle the case where product cannot be deleted due to orders
        if (data.can_deactivate) {
          const deactivateConfirm = window.confirm(
            `${data.message}\n\nWould you like to deactivate this product instead? This will hide it from customers but preserve order history.`
          );
          
          if (deactivateConfirm) {
            // Deactivate the product instead
            handleStatusToggle(productId, 'active'); // This will change it to inactive
          }
        } else {
          toast.error(data.message || 'Failed to delete product');
        }
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product. Please try again.');
    }
  };

  // Add this enhanced delete function that provides better options
  const handleDeleteProductAdvanced = async (productId, productName) => {
    try {
      // First check if the product can be deleted
      const checkResponse = await fetch(`http://localhost:5000/api/products/${productId}/delete-check`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        
        if (checkData.has_orders) {
          // Product has orders, offer deactivation instead
          const message = `"${productName}" cannot be deleted because it has ${checkData.order_count} order(s).\n\nOptions:\n1. Deactivate (recommended) - Hides from customers but preserves order history\n2. Cancel - Keep as is\n\nClick OK to deactivate or Cancel to keep the product active.`;
          
          if (window.confirm(message)) {
            await handleStatusToggle(productId, 'active'); // Will deactivate
            toast.info(`"${productName}" has been deactivated instead of deleted.`);
          }
          return;
        }
      }

      // Product can be safely deleted
      const confirmMessage = `Are you sure you want to permanently delete "${productName}"?\n\nThis will:\n• Remove the product completely\n• Delete all images and reviews\n• Remove from customer carts and wishlists\n\nThis cannot be undone.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      // Proceed with deletion
      const loadingToast = toast.loading('Deleting product...');
      
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok && data.success) {
        setProducts(products.filter(product => product.product_id !== productId));
        toast.success('Product deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount).replace('LKR', 'Rs.');
  };

  const getProductImageUrl = (product) => {
    if (product.primary_image) {
      if (product.primary_image.startsWith("/uploads/")) {
        return `http://localhost:5000${product.primary_image}`;
      }
      return product.primary_image;
    }
    return "https://via.placeholder.com/300x300/f5e6d3/5e3023?text=No+Image";
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'stock':
          return a.stock_quantity - b.stock_quantity;
        case 'created_at':
        default:
          return new Date(b.date_created) - new Date(a.date_created);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff9f5] to-[#f5e6d3] py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
          <p className="text-[#8c5f53]">Loading arts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f5] to-[#f5e6d3] py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#e7dcca] mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-[#5e3023]">Manage Arts</h1>
              <p className="text-[#8c5f53] mt-2">Manage your store's arts inventory</p>
            </div>
            <button
              onClick={() => navigate('/add-product')}
              className="bg-gradient-to-r from-[#8c7c68] to-[#c25d52] text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Art
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5e3023] mb-2">Search Art</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5e3023] mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
              >
                <option value="all">All Art</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5e3023] mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
              >
                <option value="created_at">Date Created</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock Quantity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#e7dcca] text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#d3756b] to-[#c25d52] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#5e3023] mb-4">No Art Found</h2>
            <p className="text-[#8c5f53] mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'No products match your current filters.' 
                : 'You haven\'t added any products yet.'}
            </p>
            <button
              onClick={() => navigate('/add-product')}
              className="bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Add Your First Art
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.product_id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#e7dcca] hover:shadow-xl transition-all duration-300">
                {/* Product Image */}
                <div className="h-48 bg-gray-200 relative">
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x300/f5e6d3/5e3023?text=No+Image";
                    }}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Stock Warning */}
                  {product.stock_quantity <= 5 && (
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        product.stock_quantity === 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#5e3023] mb-2 truncate">{product.name}</h3>
                  <p className="text-[#8c5f53] text-sm mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-[#d3756b]">{formatCurrency(product.price)}</span>
                    <span className="text-sm text-[#8c5f53]">Stock: {product.stock_quantity}</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.avg_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-[#8c5f53]">
                        ({product.review_count} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      to={`/edit-product/${product.product_id}`}
                      className="flex-1 bg-gradient-to-r from-[#e7dcca] to-[#d3c2a8] text-[#5e3023] py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm text-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleStatusToggle(product.product_id, product.status)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm ${
                        product.status === 'active'
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'
                          : 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                      }`}
                    >
                      {product.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteProductAdvanced(product.product_id, product.name)}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm"
                      title={`Delete ${product.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/supplier-dashboard')}
            className="bg-gradient-to-r from-[#fff9f5] to-[#f5e6d3] text-[#5e3023] px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-[#e7dcca] flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>
      <ToastContainer 
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
    </div>
  );
};

export default ManageProducts;