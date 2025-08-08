import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StoreSettingsPage = () => {
  const [store, setStore] = useState({
    store_id: "",
    name: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    logo_url: "",
    hero_image_url: "",
    opening_hours: {
      Monday: "9:00 AM - 5:00 PM",
      Tuesday: "9:00 AM - 5:00 PM",
      Wednesday: "9:00 AM - 5:00 PM",
      Thursday: "9:00 AM - 5:00 PM",
      Friday: "9:00 AM - 5:00 PM",
      Saturday: "10:00 AM - 3:00 PM",
      Sunday: "Closed",
    },
    is_active: true,
    avg_rating: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);

  useEffect(() => {
    checkStore();
  }, []);

  const checkStore = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to manage store settings');
        return;
      }

      const response = await fetch('http://localhost:5000/api/stores/check', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasStore && data.store) {
          setHasStore(true);
          fetchStoreDetails(data.store.store_id);
        } else {
          setHasStore(false);
          setLoading(false);
        }
      } else {
        toast.error('Failed to check store status');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking store:', error);
      toast.error('Error checking store status');
      setLoading(false);
    }
  };

  const fetchStoreDetails = async (storeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/stores/${storeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const storeData = data.store;
        
        setStore({
          store_id: storeData.store_id || "",
          name: storeData.name || "",
          description: storeData.description || "",
          address: storeData.address || "",
          city: storeData.city || "",
          phone: storeData.phone || "",
          email: storeData.email || "",
          logo_url: storeData.logo_url || "",
          hero_image_url: storeData.hero_image_url || "",
          opening_hours: storeData.opening_hours || {
            Monday: "9:00 AM - 5:00 PM",
            Tuesday: "9:00 AM - 5:00 PM",
            Wednesday: "9:00 AM - 5:00 PM",
            Thursday: "9:00 AM - 5:00 PM",
            Friday: "9:00 AM - 5:00 PM",
            Saturday: "10:00 AM - 3:00 PM",
            Sunday: "Closed",
          },
          is_active: storeData.is_active || true,
          avg_rating: storeData.avg_rating || 0
        });
      } else {
        toast.error('Failed to fetch store details');
      }
    } catch (error) {
      console.error('Error fetching store details:', error);
      toast.error('Error fetching store details');
    } finally {
      setLoading(false);
    }
  };

  const createStore = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fix the URL - remove duplicate 'stores'
      const response = await fetch('http://localhost:5000/api/stores/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "My Bakery Store",
          description: "Welcome to my bakery!",
          address: "123 Bakery Street",
          city: "Sweet City",
          phone: "555-0123"
        })
      });

      if (response.ok) {
        toast.success('Store created successfully!');
        checkStore(); // Refresh store data
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create store');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error('Error creating store');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("opening_hours.")) {
      const day = name.split(".")[1];
      setStore((prev) => ({
        ...prev,
        opening_hours: { ...prev.opening_hours, [day]: value },
      }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
    } else {
      setStore((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!store.name.trim()) newErrors.name = "Store name is required";
    if (!store.phone.trim()) newErrors.phone = "Phone is required";
    if (!store.address.trim()) newErrors.address = "Address is required";
    if (!store.city.trim()) newErrors.city = "City is required";
    
    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please correct the errors before saving");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/stores/${store.store_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: store.name,
          description: store.description,
          address: store.address,
          city: store.city,
          phone: store.phone,
          email: store.email,
          logo_url: store.logo_url,
          hero_image_url: store.hero_image_url,
          opening_hours: store.opening_hours
        })
      });

      if (response.ok) {
        toast.success("Store settings updated successfully");
        setIsEditing(false);
        setErrors({});
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update store settings');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error('Error updating store settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store settings...</p>
        </div>
      </div>
    );
  }

  if (!hasStore) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <ToastContainer />
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mt-20">
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-semibold mb-4">No Store Found</h2>
            <p className="text-gray-600 mb-6">
              You don't have a store yet. Create one to start selling your products.
            </p>
            <button
              onClick={createStore}
              className="px-6 py-3 bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white hover:from-[#c25d52] hover:to-[#b54842] rounded-lg font-semibold transition duration-200"
            >
              Create My Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <ToastContainer />
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mt-20">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Store Settings</h1>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                store.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {store.is_active ? 'Active' : 'Inactive'}
              </span>
              {store.avg_rating > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  ⭐ {store.avg_rating}/5
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Store Information */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[#d3756b]">Store Information</h2>
              <div className="mb-4">
                <label className="block font-medium mb-1">Store Name *</label>
                <input
                  type="text"
                  name="name"
                  value={store.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded border ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  } ${!isEditing ? "bg-gray-50" : ""}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={store.description}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded border border-gray-300 ${!isEditing ? "bg-gray-50" : ""}`}
                  placeholder="Tell customers about your store..."
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1">Store Email</label>
                <input
                  type="email"
                  name="email"
                  value={store.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded border border-gray-300 ${!isEditing ? "bg-gray-50" : ""}`}
                  placeholder="store@example.com"
                />
              </div>
            </div>

            {/* Contact & Location */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[#d3756b]">Contact & Location</h2>
              <div className="mb-4">
                <label className="block font-medium mb-1">Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  value={store.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded border ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  } ${!isEditing ? "bg-gray-50" : ""}`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={store.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded border ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  } ${!isEditing ? "bg-gray-50" : ""}`}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={store.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded border ${
                    errors.city ? "border-red-500" : "border-gray-300"
                  } ${!isEditing ? "bg-gray-50" : ""}`}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>
            </div>

            {/* Store Images */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-4 text-[#d3756b]">Store Images</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Logo URL</label>
                  <input
                    type="url"
                    name="logo_url"
                    value={store.logo_url}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 rounded border border-gray-300 ${!isEditing ? "bg-gray-50" : ""}`}
                    placeholder="https://example.com/logo.jpg"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Hero Image URL</label>
                  <input
                    type="url"
                    name="hero_image_url"
                    value={store.hero_image_url}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 rounded border border-gray-300 ${!isEditing ? "bg-gray-50" : ""}`}
                    placeholder="https://example.com/hero.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-4 text-[#d3756b]">Business Hours</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(store.opening_hours).map((day) => (
                  <div key={day} className="mb-4">
                    <label className="block font-medium mb-1">{day}</label>
                    <input
                      type="text"
                      name={`opening_hours.${day}`}
                      value={store.opening_hours[day]}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 rounded border border-gray-300 text-sm ${!isEditing ? "bg-gray-50" : ""}`}
                      placeholder="9:00 AM - 5:00 PM"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-2 flex justify-end gap-4 mt-6 pt-6 border-t">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setErrors({});
                      // Reset to original data if needed
                      fetchStoreDetails(store.store_id);
                    }}
                    className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded font-semibold transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white hover:from-[#c25d52] hover:to-[#b54842] rounded font-semibold transition duration-200"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white hover:from-[#c25d52] hover:to-[#b54842] rounded font-semibold transition duration-200"
                >
                  Edit Settings
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreSettingsPage;