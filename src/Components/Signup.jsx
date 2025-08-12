import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignUpPage = () => {
  const [role, setRole] = useState("customer");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    // Supplier specific fields
    business_name: "",
    business_address: "",
    business_phone: "",
    city: "",
    store_description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate common fields
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    if (!formData.agreeTerms) newErrors.agreeTerms = "You must agree to the terms";
    
    // Validate supplier fields
    if (role === "supplier") {
      if (!formData.business_name.trim()) newErrors.business_name = "Business name is required";
      if (!formData.business_address.trim()) newErrors.business_address = "Business address is required";
      if (!formData.business_phone.trim()) newErrors.business_phone = "Phone number is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for API
      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
      };
      
      // Add supplier fields if registering as supplier
      if (role === "supplier") {
        userData.business_name = formData.business_name;
        userData.business_address = formData.business_address;
        userData.business_phone = formData.business_phone;
        userData.city = formData.city;
        userData.store_description = formData.store_description;
      }
      
      // Call appropriate API endpoint based on role
      let response;
      if (role === "supplier") {
        response = await authService.registerSupplier(userData);
      } else {
        response = await authService.registerCustomer(userData);
      }
      
      if (role === "supplier") {
        toast.success("Supplier account and store created successfully!");
      } else {
        toast.success("Registration successful!");
      }
      
      // Navigate based on role
      if (role === "supplier") {
        navigate("/supplier-dashboard");
      } else {
        navigate("/home");
      }
      
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9f5] py-16 px-4">
      <ToastContainer position="top-right" />
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-[#064232] p-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            Create Account
          </h2>
          <p className="text-white mt-2">
            {role === "supplier" ? "Start your bakery business today" : "Join our sweet community today"}
          </p>
        </div>

        {/* Role Selection */}
        <div className="mb-4 mt-6 flex justify-center space-x-4">
          <button
            type="button"
            className={`px-6 py-2 rounded-full transition-all duration-200 ${
              role === "customer"
                ? "bg-[#064232] text-white shadow-md"
                : "bg-gray-200 text-[#5e3023] hover:bg-gray-300"
            }`}
            onClick={() => setRole("customer")}
          >
            Customer
          </button>
          <button
            type="button"
            className={`px-6 py-2 rounded-full transition-all duration-200 ${
              role === "supplier"
                ? "bg-[#064232] text-white shadow-md"
                : "bg-gray-200 text-[#5e3023] hover:bg-gray-300"
            }`}
            onClick={() => setRole("supplier")}
          >
            Supplier
          </button>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignUp} className="p-8">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="first_name" className="block text-[#5e3023] font-medium mb-2">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-full border ${
                  errors.first_name ? 'border-red-500' : 'border-[#064232]'
                } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                placeholder="First Name"
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-[#5e3023] font-medium mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-full border ${
                  errors.last_name ? 'border-red-500' : 'border-[#064232]'
                } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                placeholder="Last Name"
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          {role === "supplier" && (
            <>
              <div className="mb-6">
                <label htmlFor="business_name" className="block text-[#5e3023] font-medium mb-2">
                  Business Name / Store Name
                </label>
                <input
                  type="text"
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-full border ${
                    errors.business_name ? 'border-red-500' : 'border-[#064232]'
                  } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                  placeholder="e.g., Sweet Delights Bakery"
                />
                {errors.business_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.business_name}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="business_address" className="block text-[#5e3023] font-medium mb-2">
                  Store Address
                </label>
                <input
                  type="text"
                  id="business_address"
                  name="business_address"
                  value={formData.business_address}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-full border ${
                    errors.business_address ? 'border-red-500' : 'border-[#064232]'
                  } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                  placeholder="Complete store address"
                />
                {errors.business_address && (
                  <p className="text-red-500 text-sm mt-1">{errors.business_address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="city" className="block text-[#5e3023] font-medium mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-full border ${
                      errors.city ? 'border-red-500' : 'border-[#064232]'
                    } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="business_phone" className="block text-[#5e3023] font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="business_phone"
                    name="business_phone"
                    value={formData.business_phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-full border ${
                      errors.business_phone ? 'border-red-500' : 'border-[#064232]'
                    } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                    placeholder="Contact number"
                  />
                  {errors.business_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.business_phone}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="store_description" className="block text-[#5e3023] font-medium mb-2">
                  Store Description (Optional)
                </label>
                <textarea
                  id="store_description"
                  name="store_description"
                  value={formData.store_description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-[#064232] focus:outline-none focus:ring-2 focus:ring-[#d3756b] resize-none"
                  placeholder="Describe your bakery and specialties..."
                />
              </div>
            </>
          )}

          <div className="mb-6">
            <label htmlFor="email" className="block text-[#5e3023] font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-full border ${
                errors.email ? 'border-red-500' : 'border-[#064232]'
              } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-[#5e3023] font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-full border ${
                errors.password ? 'border-red-500' : 'border-[#064232]'
              } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
              placeholder="Create a password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-[#5e3023] font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-full border ${
                errors.confirmPassword ? 'border-red-500' : 'border-[#064232]'
              } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className={`h-4 w-4 text-[#d3756b] focus:ring-[#d3756b] border-[#e7dcca] rounded ${
                errors.agreeTerms ? 'border-red-500' : ''
              }`}
            />
            <label
              htmlFor="agreeTerms"
              className={`ml-2 ${errors.agreeTerms ? 'text-red-500' : 'text-[#8c5f53]'}`}
            >
              I agree to the{" "}
              <a href="#" className="text-[#d3756b] hover:text-[#c25d52]">
                Terms and Conditions
              </a>
            </label>
          </div>

          {role === "supplier" && (
            <div className="mb-6 p-4 bg-[#fff9f5] rounded-lg border border-[#e7dcca]">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#d3756b] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-[#5e3023] mb-1">Store Creation</h4>
                  <p className="text-sm text-[#8c5f53]">
                    Your store will be created automatically when you register. You can update store details and add Arts after registration.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-[#064232] hover:bg-[#c25d52] text-white py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              role === "supplier" ? "CREATE STORE & ACCOUNT" : "SIGN UP"
            )}
          </button>

          <div className="text-center mt-8 text-[#8c5f53]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#d3756b] hover:text-[#c25d52] font-medium"
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;