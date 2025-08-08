import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { useAuth } from "../context/AuthContext";

const StoreCreationPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [storeData, setStoreData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    operating_hours: "",
    logo_url: "",
    banner_url: "",
    is_active: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStoreData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!storeData.name.trim()) {
      errors.name = "Store name is required";
    }
    
    if (!storeData.description.trim()) {
      errors.description = "Store description is required";
    }
    
    if (!storeData.address.trim()) {
      errors.address = "Store address is required";
    }
    
    if (!storeData.city.trim()) {
      errors.city = "City is required";
    }
    
    if (!storeData.phone.trim()) {
      errors.phone = "Phone number is required";
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication required');
        navigate('/login');
        return;
      }

      // Make API call to create store
      const response = await fetch('http://localhost:5000/api/stores/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storeData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Store created successfully!');
        navigate("/supplier-dashboard");
      } else {
        toast.error(data.message || 'Failed to create store');
      }

    } catch (error) {
      console.error('Error creating store:', error);
      toast.error('Error creating store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const testDatabase = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/stores/test-db', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Database test result:', data);
      
      if (data.success) {
        toast.info(`DB Test: Table exists: ${data.table_exists}, Store count: ${data.store_count?.store_count}`);
      } else {
        toast.error(`DB Test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Database test error:', error);
      toast.error('Database test failed');
    }
  };

  const testSimpleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/stores/create-simple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storeData)
      });
      
      const data = await response.json();
      console.log('Simple create result:', data);
      
      if (data.success) {
        toast.success(`Simple create successful! Verified: ${data.verified}`);
      } else {
        toast.error(`Simple create failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Simple create error:', error);
      toast.error('Simple create failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9f5] py-12 px-4 pt-24">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e7dcca] overflow-hidden pt-24">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5e3023] to-[#d3756b] px-8 py-6 pt-12">
            <h1 className="text-3xl font-bold text-white mb-2">Create Your Store</h1>
            <p className="text-white/90">Set up your bakery store and start selling delicious treats!</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Store Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#5e3023] mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={storeData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent transition-colors"
                  placeholder="Enter your store name (e.g., Sweet Delights Bakery)"
                  required
                />
              </div>

              {/* Store Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#5e3023] mb-2">
                  Store Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={storeData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent transition-colors resize-none"
                  placeholder="Describe your bakery, specialties, and what makes it unique..."
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-[#5e3023] mb-2">
                  Store Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={storeData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent transition-colors"
                  placeholder="Enter your complete store address"
                  required
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-[#5e3023] mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={storeData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent transition-colors"
                  placeholder="Enter city name"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#5e3023] mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={storeData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent transition-colors"
                  placeholder="Enter store phone number"
                  required
                />
              </div>

              {/* Operating Hours */}
              <div>
                <label htmlFor="operating_hours" className="block text-sm font-medium text-[#5e3023] mb-2">
                  Operating Hours
                </label>
                <input
                  type="text"
                  id="operating_hours"
                  name="operating_hours"
                  value={storeData.operating_hours}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent transition-colors"
                  placeholder="e.g., Mon-Sat: 8:00 AM - 8:00 PM, Sun: 9:00 AM - 6:00 PM"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-[#5e3023] mb-2">
                  Logo URL (Optional)
                </label>
                <input
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  value={storeData.logo_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent transition-colors"
                  placeholder="https://example.com/logo.jpg"
                />
              </div>

              {/* Banner URL */}
              <div>
                <label htmlFor="banner_url" className="block text-sm font-medium text-[#5e3023] mb-2">
                  Banner URL (Optional)
                </label>
                <input
                  type="url"
                  id="banner_url"
                  name="banner_url"
                  value={storeData.banner_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7dcca] rounded-lg focus:ring-2 focus:ring-[#d3756b] focus:border-transparent transition-colors"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={storeData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#d3756b] focus:ring-[#d3756b] border-[#e7dcca] rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-[#5e3023]">
                  Make store active immediately
                </label>
              </div>

              {/* Test Buttons */}
              <div className="pt-6 border-t border-[#e7dcca]">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={testDatabase}
                    className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
                  >
                    Test DB
                  </button>
                  <button
                    type="button"
                    onClick={testSimpleCreate}
                    className="px-4 py-2 bg-green-500 text-white rounded text-sm"
                  >
                    Test Simple Create
                  </button>
                </div>
                
                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/supplier-dashboard')}
                    className="flex-1 px-6 py-3 border border-[#e7dcca] text-[#5e3023] rounded-lg hover:bg-[#f5e6d3] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#d3756b] hover:bg-[#c25d52] text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Store
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Info Section */}
          <div className="bg-[#fff9f5] px-8 py-6 border-t border-[#e7dcca]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-[#d3756b]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#5e3023] mb-1">Getting Started</h3>
                <p className="text-sm text-[#8c5f53]">
                  After creating your store, you'll be able to add products, manage orders, and customize your store settings. 
                  Make sure to provide accurate information as this will be displayed to customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreCreationPage;
