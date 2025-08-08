import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

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
    
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.password) newErrors.password = "Password is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the login from auth context
      await login(formData.email, formData.password);
      
      toast.success("Login successful!");
      
      // Save "remember me" preference if selected
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      // Navigate to home page after successful login
      navigate("/home", { replace: true });
      
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.message || "Invalid email or password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      toast.error("Please enter a valid email");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.forgotPassword(forgotEmail);
      toast.success("If your email is registered, you will receive a password reset link");
      setShowForgotPassword(false);
    } catch (error) {
      console.error("Forgot password error:", error);
      // Don't reveal if email exists or not for security
      toast.info("If your email is registered, you will receive a password reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9f5] py-16 px-4">
      <ToastContainer position="top-right" />
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-[#e7dcca] p-6 text-center">
          <h2 className="text-3xl font-bold text-[#5e3023]">Welcome Back</h2>
          <p className="text-[#8c5f53] mt-2">Please login to your account</p>
        </div>

        {!showForgotPassword ? (
          <form onSubmit={handleSubmit} className="p-8">
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
                  errors.email ? 'border-red-500' : 'border-[#e7dcca]'
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
                  errors.password ? 'border-red-500' : 'border-[#e7dcca]'
                } focus:outline-none focus:ring-2 focus:ring-[#d3756b]`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#d3756b] focus:ring-[#d3756b] border-[#e7dcca] rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 text-[#8c5f53]">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-[#d3756b] hover:text-[#c25d52] font-medium"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#d3756b] hover:bg-[#c25d52] text-white py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "LOGIN"
              )}
            </button>

            <div className="text-center mt-8 text-[#8c5f53]">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#d3756b] hover:text-[#c25d52] font-medium">
                Sign up
              </Link>
            </div>
          </form>
        ) : (
          <div className="p-8">
            <h3 className="text-xl font-bold text-[#5e3023] mb-4">Reset Your Password</h3>
            <p className="text-[#8c5f53] mb-6">Enter your email address and we'll send you a link to reset your password.</p>
            
            <div className="mb-6">
              <label htmlFor="forgotEmail" className="block text-[#5e3023] font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="forgotEmail"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-full border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-[#5e3023] py-3 rounded-full font-bold transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className={`flex-1 bg-[#d3756b] hover:bg-[#c25d52] text-white py-3 rounded-full font-bold transition-all duration-300 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;