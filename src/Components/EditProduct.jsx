import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const EditProduct = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sale_price: '',
    category_id: '',
    stock_quantity: '',
    is_featured: false,
    is_active: true,
    loyalty_points_earned: '0'
  });
  const [currentImage, setCurrentImage] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch product data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          if (categoriesData.success) {
            setCategories(categoriesData.categories);
          }
        }

        // Fetch product data
        const productResponse = await fetch(`http://localhost:5000/api/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (productResponse.ok) {
          const productData = await productResponse.json();
          if (productData.success) {
            const product = productData.product;
            setFormData({
              name: product.name || '',
              description: product.description || '',
              price: product.price?.toString() || '',
              sale_price: product.sale_price?.toString() || '',
              category_id: product.category_id || '',
              stock_quantity: product.stock_quantity?.toString() || '',
              is_featured: product.is_featured || false,
              is_active: product.is_active !== false, // Default to true if undefined
              loyalty_points_earned: product.loyalty_points_earned?.toString() || '0'
            });
            
            // Set current image
            if (product.image_url) {
              setCurrentImage(product.image_url.startsWith('/uploads/') 
                ? `http://localhost:5000${product.image_url}` 
                : product.image_url
              );
            }
          } else {
            toast.error('Product not found');
            navigate('/manage-products');
          }
        } else {
          toast.error('Failed to fetch product data');
          navigate('/manage-products');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error loading product data');
        navigate('/manage-products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, WebP)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setNewImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeNewImage = () => {
    setNewImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) errors.push('Product name is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Valid price is required');
    if (!formData.category_id) errors.push('Category is required');
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) errors.push('Valid stock quantity is required');

    if (formData.sale_price && parseFloat(formData.sale_price) >= parseFloat(formData.price)) {
      errors.push('Sale price must be less than regular price');
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      // Add image if new one is selected
      if (newImage) {
        submitData.append('image', newImage);
      }

      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Product updated successfully!');
        navigate('/manage-products');
      } else {
        toast.error(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error updating product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff9f5] to-[#f5e6d3] py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
          <p className="text-[#8c5f53]">Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff9f5] to-[#f5e6d3] py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#e7dcca] mt-16">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#5e3023]">Edit Product</h1>
                <p className="text-[#8c5f53] mt-2">Update your product information</p>
              </div>
              <button
                onClick={() => navigate('/manage-products')}
                className="bg-gradient-to-r from-[#e7dcca] to-[#d3c2a8] text-[#5e3023] px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Products
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#5e3023] mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5e3023] mb-2">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#5e3023] mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
                placeholder="Describe your product..."
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#5e3023] mb-2">
                  Price (Rs.) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5e3023] mb-2">
                  Sale Price (Rs.)
                </label>
                <input
                  type="number"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
                  placeholder="Optional sale price"
                />
              </div>
            </div>

            {/* Stock and Loyalty Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#5e3023] mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5e3023] mb-2">
                  Loyalty Points Earned
                </label>
                <input
                  type="number"
                  name="loyalty_points_earned"
                  value={formData.loyalty_points_earned}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-[#5e3023] mb-2">
                Product Image
              </label>
              
              {/* Current Image */}
              {currentImage && !imagePreview && (
                <div className="mb-4">
                  <p className="text-sm text-[#8c5f53] mb-2">Current Image:</p>
                  <img
                    src={currentImage}
                    alt="Current product"
                    className="w-32 h-32 object-cover rounded-lg border border-[#e7dcca]"
                  />
                </div>
              )}

              {/* New Image Preview */}
              {imagePreview && (
                <div className="mb-4">
                  <p className="text-sm text-[#8c5f53] mb-2">New Image Preview:</p>
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-[#e7dcca]"
                    />
                    <button
                      type="button"
                      onClick={removeNewImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <input
                type="file"
                id="image"
                name="image"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#f5e6d3] file:text-[#5e3023] hover:file:bg-[#e7dcca]"
              />
              <p className="text-xs text-[#8c5f53] mt-1">
                Supported formats: JPEG, PNG, WebP. Max size: 5MB
              </p>
            </div>

            {/* Product Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_featured"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#d3756b] bg-gray-100 border-gray-300 rounded focus:ring-[#d3756b] focus:ring-2"
                />
                <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-[#5e3023]">
                  Featured Product
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#d3756b] bg-gray-100 border-gray-300 rounded focus:ring-[#d3756b] focus:ring-2"
                />
                <label htmlFor="is_active" className="ml-2 text-sm font-medium text-[#5e3023]">
                  Active Product
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating Product...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Update Product
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/manage-products')}
                className="flex-1 bg-gradient-to-r from-[#e7dcca] to-[#d3c2a8] text-[#5e3023] py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;