import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    user_id: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    city: "",
    role: "",
    loyalty_points: 0,
    date_joined: "",
    last_login: "",
    is_active: true,
    // Supplier specific fields
    business_name: "",
    business_address: "",
    business_phone: "",
    tax_id: "",
    is_verified: false
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view your profile');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!profile.first_name.trim()) newErrors.first_name = "First name is required";
    if (!profile.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!profile.phone.trim()) newErrors.phone = "Phone is required";
    if (!profile.address.trim()) newErrors.address = "Address is required";
    if (!profile.city.trim()) newErrors.city = "City is required";

    // Validate supplier fields if user is a supplier
    if (profile.role === 'supplier') {
      if (!profile.business_name.trim()) newErrors.business_name = "Business name is required";
      if (!profile.business_address.trim()) newErrors.business_address = "Business address is required";
      if (!profile.business_phone.trim()) newErrors.business_phone = "Business phone is required";
    }

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
      const updateData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city
      };

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        setErrors({});
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: passwordData.newPassword
        })
      });

      if (response.ok) {
        toast.success("Password updated successfully");
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'supplier':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <ToastContainer />
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mt-20">
        <div className="p-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Profile Information</h1>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(profile.role)}`}>
                {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)}
              </span>
              {profile.role === 'supplier' && (
                <span className={`px-3 py-1 rounded-full text-sm ${
                  profile.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.is_verified ? 'Verified' : 'Pending Verification'}
                </span>
              )}
              {profile.role === 'customer' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  {profile.loyalty_points} Loyalty Points
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[#d3756b]">Personal Information</h2>
              
              <div className="mb-4">
                <label className="block font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 rounded border ${
                      errors.first_name ? "border-red-500" : "border-gray-300"
                    } ${!isEditing ? "bg-gray-50" : ""}`}
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 rounded border ${
                      errors.last_name ? "border-red-500" : "border-gray-300"
                    } ${!isEditing ? "bg-gray-50" : ""}`}
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1">Phone *</label>
                <input
                  type="text"
                  name="phone"
                  value={profile.business_phone || ""}
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
                  value={profile.business_address || ""}
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

            </div>

            {/* Account & Business Information */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[#d3756b]">
                {profile.role === 'supplier' ? 'Business Information' : 'Account Information'}
              </h2>

              {profile.role === 'supplier' ? (
                <>
                  <div className="mb-4">
                    <label className="block font-medium mb-1">Business Name *</label>
                    <input
                      type="text"
                      name="business_name"
                      value={profile.business_name || ""}
                      disabled
                      className="w-full px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Contact support to change business name</p>
                  </div>

                  <div className="mb-4">
                    <label className="block font-medium mb-1">Business Address</label>
                    <input
                      type="text"
                      value={profile.business_address || "N/A"}
                      disabled
                      className="w-full px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-600"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block font-medium mb-1">Business Phone</label>
                    <input
                      type="text"
                      value={profile.business_phone || "N/A"}
                      disabled
                      className="w-full px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-600"
                    />
                  </div>

                  {profile.tax_id && (
                    <div className="mb-4">
                      <label className="block font-medium mb-1">Tax ID</label>
                      <input
                        type="text"
                        value={profile.tax_id}
                        disabled
                        className="w-full px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-600"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800 mb-2">Loyalty Program</h3>
                    <p className="text-2xl font-bold text-purple-600">{profile.loyalty_points} Points</p>
                    <p className="text-sm text-purple-600">Keep shopping to earn more rewards!</p>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block font-medium mb-1">Member Since</label>
                <input
                  type="text"
                  value={formatDate(profile.date_joined)}
                  disabled
                  className="w-full px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-600"
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1">Last Login</label>
                <input
                  type="text"
                  value={formatDate(profile.last_login)}
                  disabled
                  className="w-full px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            {/* Security Section */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-4 text-[#d3756b]">Security</h2>
              
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="px-6 py-2 bg-[#8c7c68] text-white hover:bg-gray-700 rounded font-semibold transition duration-200"
                >
                  Change Password
                </button>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-4">Change Password</h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block font-medium mb-1">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 rounded border border-gray-300"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePasswordUpdate}
                      className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded font-semibold transition duration-200"
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: ""
                        });
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded font-semibold transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-2 flex justify-end gap-4 mt-6 pt-6 border-t">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setErrors({});
                      fetchProfile(); // Reset to original data
                    }}
                    className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded font-semibold transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-gradient-to-r from-[#8c7c68] to-[#c25d52] text-white hover:from-[#c25d52] hover:to-[#b54842] rounded font-semibold transition duration-200"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-gradient-to-r from-[#8c7c68] to-[#c25d52] text-white hover:from-[#c25d52] hover:to-[#b54842] rounded font-semibold transition duration-200"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;