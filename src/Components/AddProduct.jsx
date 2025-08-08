import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddProduct = () => {
    const { currentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        sale_price: '',
        category_id: '',
        stock_quantity: '',
        is_featured: false,
        is_active: true,
        image: null,
        loyalty_points_earned: '0'
    });

    const [errors, setErrors] = useState({});

    // Check if user is authenticated and is a supplier
    if (!isAuthenticated || currentUser?.role !== 'supplier') {
        return (
            <div className="min-h-screen bg-[#fff9f5] py-16 px-4 flex items-center justify-center">
                <ToastContainer />
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#5e3023] mb-4">Access Denied</h1>
                    <p className="text-[#8c5f53] mb-6">You need to be logged in as a supplier to add products.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-3 rounded-full font-bold transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Fetch categories from the API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/categories', {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setCategories(data.categories);
                    } else {
                        toast.error('Failed to load categories');
                        // Fallback to default categories if API fails
                        setCategories([
                            { category_id: 'cat1', name: 'Cakes' },
                            { category_id: 'cat2', name: 'Cupcakes' },
                            { category_id: 'cat3', name: 'Pastries' },
                            { category_id: 'cat4', name: 'Cookies' },
                            { category_id: 'cat5', name: 'Brownies' }
                        ]);
                    }
                } else {
                    throw new Error('Failed to fetch categories');
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('Failed to load categories');
                // Fallback categories
                setCategories([
                    { category_id: 'cat1', name: 'Cakes' },
                    { category_id: 'cat2', name: 'Cupcakes' },
                    { category_id: 'cat3', name: 'Pastries' },
                    { category_id: 'cat4', name: 'Cookies' },
                    { category_id: 'cat5', name: 'Brownies' }
                ]);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error('Please select a valid image file (JPEG, PNG, WebP)');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            setFormData(prev => ({ ...prev, image: file }));
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
        if (!formData.category_id) newErrors.category_id = 'Category is required';
        if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) newErrors.stock_quantity = 'Valid stock quantity is required';
        if (!formData.image) newErrors.image = 'Product image is required';

        // Validate sale price if provided
        if (formData.sale_price && parseFloat(formData.sale_price) >= parseFloat(formData.price)) {
            newErrors.sale_price = 'Sale price must be less than regular price';
        }

        // Validate loyalty points
        if (formData.loyalty_points_earned && parseInt(formData.loyalty_points_earned) < 0) {
            newErrors.loyalty_points_earned = 'Loyalty points must be 0 or greater';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please log in again');
                navigate('/login');
                return;
            }

            // Create FormData for file upload
            const productData = new FormData();
            
            // Append all form fields according to your schema
            productData.append('name', formData.name.trim());
            productData.append('description', formData.description.trim());
            productData.append('price', formData.price);
            productData.append('category_id', formData.category_id);
            productData.append('stock_quantity', formData.stock_quantity);
            productData.append('is_featured', formData.is_featured);
            productData.append('is_active', formData.is_active);
            productData.append('loyalty_points_earned', formData.loyalty_points_earned || '0');
            
            // Only append sale_price if it has a value
            if (formData.sale_price && formData.sale_price.trim() !== '') {
                productData.append('sale_price', formData.sale_price);
            }

            // Append image file
            if (formData.image) {
                productData.append('image', formData.image);
            }

            console.log('Submitting product data...');

            const response = await fetch('http://localhost:5000/api/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type for FormData - browser will set it with boundary
                },
                body: productData
            });

            const responseData = await response.json();
            console.log('Response:', responseData);

            if (response.ok && responseData.success) {
                toast.success('Product added successfully!');
                
                // Reset form
                setFormData({
                    name: '',
                    description: '',
                    price: '',
                    sale_price: '',
                    category_id: '',
                    stock_quantity: '',
                    is_featured: false,
                    is_active: true,
                    image: null,
                    loyalty_points_earned: '0'
                });
                setImagePreview(null);
                setErrors({});
                
                // Redirect to supplier dashboard after 2 seconds
                setTimeout(() => {
                    navigate('/supplier-dashboard');
                }, 2000);
            } else {
                throw new Error(responseData.message || 'Failed to add product');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            
            let errorMessage = 'Failed to add product. Please try again.';
            
            if (error.message.includes('401') || error.message.includes('token')) {
                errorMessage = 'Your session has expired. Please log in again.';
                setTimeout(() => navigate('/login'), 2000);
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingCategories) {
        return (
            <div className="min-h-screen bg-[#fff9f5] py-16 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto"></div>
                    <p className="mt-4 text-[#8c5f53]">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fff9f5] py-16 px-4">
            <ToastContainer position="top-right" />
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-[#e7dcca] mt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[#5e3023] mb-2">Add New Product</h1>
                            <p className="text-[#8c5f53]">Add a new product to your store catalog</p>
                        </div>
                        <button
                            onClick={() => navigate('/supplier-dashboard')}
                            className="bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-[#e7dcca]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Product Name */}
                            <div>
                                <label htmlFor="name" className="block text-[#5e3023] font-medium mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        errors.name ? 'border-red-500' : 'border-[#e7dcca]'
                                    } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                                    placeholder="e.g., Chocolate Truffle Cake"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-[#5e3023] font-medium mb-2">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        errors.description ? 'border-red-500' : 'border-[#e7dcca]'
                                    } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                                    placeholder="Describe your product..."
                                />
                                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                            </div>

                            {/* Price and Sale Price */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="price" className="block text-[#5e3023] font-medium mb-2">
                                        Price (Rs.) *
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className={`w-full px-4 py-3 rounded-lg border ${
                                            errors.price ? 'border-red-500' : 'border-[#e7dcca]'
                                        } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                                        placeholder="2500"
                                    />
                                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                                </div>
                                <div>
                                    <label htmlFor="sale_price" className="block text-[#5e3023] font-medium mb-2">
                                        Sale Price (Rs.)
                                    </label>
                                    <input
                                        type="number"
                                        id="sale_price"
                                        name="sale_price"
                                        value={formData.sale_price}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className={`w-full px-4 py-3 rounded-lg border ${
                                            errors.sale_price ? 'border-red-500' : 'border-[#e7dcca]'
                                        } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                                        placeholder="2000 (optional)"
                                    />
                                    {errors.sale_price && <p className="text-red-500 text-sm mt-1">{errors.sale_price}</p>}
                                </div>
                            </div>

                            {/* Category and Stock */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category_id" className="block text-[#5e3023] font-medium mb-2">
                                        Category *
                                    </label>
                                    <select
                                        id="category_id"
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${
                                            errors.category_id ? 'border-red-500' : 'border-[#e7dcca]'
                                        } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.category_id} value={cat.category_id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                                </div>
                                <div>
                                    <label htmlFor="stock_quantity" className="block text-[#5e3023] font-medium mb-2">
                                        Stock Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        id="stock_quantity"
                                        name="stock_quantity"
                                        value={formData.stock_quantity}
                                        onChange={handleInputChange}
                                        min="0"
                                        className={`w-full px-4 py-3 rounded-lg border ${
                                            errors.stock_quantity ? 'border-red-500' : 'border-[#e7dcca]'
                                        } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                                        placeholder="10"
                                    />
                                    {errors.stock_quantity && <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>}
                                </div>
                            </div>

                            {/* Loyalty Points */}
                            <div>
                                <label htmlFor="loyalty_points_earned" className="block text-[#5e3023] font-medium mb-2">
                                    Loyalty Points Earned
                                </label>
                                <input
                                    type="number"
                                    id="loyalty_points_earned"
                                    name="loyalty_points_earned"
                                    value={formData.loyalty_points_earned}
                                    onChange={handleInputChange}
                                    min="0"
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        errors.loyalty_points_earned ? 'border-red-500' : 'border-[#e7dcca]'
                                    } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                                    placeholder="25"
                                />
                                {errors.loyalty_points_earned && <p className="text-red-500 text-sm mt-1">{errors.loyalty_points_earned}</p>}
                                <p className="text-sm text-[#8c5f53] mt-1">Points customers earn when purchasing this product</p>
                            </div>

                            {/* Product Options */}
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_featured"
                                        name="is_featured"
                                        checked={formData.is_featured}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-[#d3756b] focus:ring-[#d3756b] border-[#e7dcca] rounded"
                                    />
                                    <label htmlFor="is_featured" className="ml-2 text-[#5e3023] font-medium">
                                        Featured Product
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-[#d3756b] focus:ring-[#d3756b] border-[#e7dcca] rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 text-[#5e3023] font-medium">
                                        Active/Available for sale
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Product Image */}
                            <div>
                                <label htmlFor="image" className="block text-[#5e3023] font-medium mb-2">
                                    Product Image *
                                </label>
                                <div className="border-2 border-dashed border-[#e7dcca] rounded-lg p-6 text-center hover:border-[#d3756b] transition-colors">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-h-48 mx-auto rounded-lg object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setFormData(prev => ({ ...prev, image: null }));
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <svg className="mx-auto h-12 w-12 text-[#d3756b]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="mt-2 text-[#8c5f53]">Click to upload product image</p>
                                            <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="image"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="image"
                                        className="mt-4 inline-block bg-[#d3756b] hover:bg-[#c25d52] text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                                    >
                                        Choose Image
                                    </label>
                                </div>
                                {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
                            </div>

                            {/* Product Info Display */}
                            <div className="bg-[#fff9f5] rounded-lg p-4">
                                <h3 className="font-medium text-[#5e3023] mb-3">Product Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[#8c5f53]">Name:</span>
                                        <span className="text-[#5e3023] font-medium">{formData.name || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#8c5f53]">Price:</span>
                                        <span className="text-[#5e3023] font-medium">
                                            Rs. {formData.price || '0'}
                                        </span>
                                    </div>
                                    {formData.sale_price && (
                                        <div className="flex justify-between">
                                            <span className="text-[#8c5f53]">Sale Price:</span>
                                            <span className="text-green-600 font-medium">
                                                Rs. {formData.sale_price}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-[#8c5f53]">Stock:</span>
                                        <span className="text-[#5e3023] font-medium">{formData.stock_quantity || '0'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#8c5f53]">Category:</span>
                                        <span className="text-[#5e3023] font-medium">
                                            {categories.find(cat => cat.category_id === formData.category_id)?.name || 'Not selected'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#8c5f53]">Featured:</span>
                                        <span className={`font-medium ${formData.is_featured ? 'text-green-600' : 'text-gray-500'}`}>
                                            {formData.is_featured ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/supplier-dashboard')}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-[#5e3023] rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-6 py-3 bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                                isLoading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding Product...
                                </span>
                            ) : (
                                'Add Product'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProduct;