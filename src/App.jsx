import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./Components/Home";
import Navbar from "./Components/Navbar";
import LoginPage from "./Components/Login";
import SignUpPage from "./Components/Signup";
import StoreCreationPage from "./Components/StoreCreationpage";
import AboutPage from "./Components/About";
import ContactPage from "./Components/Contact";
import StoreDetails from "./Components/StoreDetails";
import Footer from "./Components/Footer";
import SupplierDashboard from "./Components/SupplierDashboard";
import AddProduct from "./Components/AddProduct";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProductsPage from "./Components/ProductsPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProfilePage from "./Components/profile";
import StoreSettingsPage from "./Components/storeSettingPage";
import OrdersPage from "./Components/OrdersPage";
import HomePage from "./Components/HomPage";
import ProductDetails from "./Components/ProductDetsils";
import Payment from "./Components/Payment";
import Wishlist from "./Components/WishList";
import Cart from "./Components/Cart";
import ManageProducts from "./Components/ManageProducts";
import EditProduct from "./Components/EditProduct";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// Public Route Component (redirect to /home if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// App Routes Component (Wrapped by AuthProvider)
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Public Store Details Route - MUST come before protected routes */}
        <Route path="/store/:storeId" element={<StoreDetails />} />
        
        {/* Protected Routes - Require Authentication */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:productId"
          element={
            <ProtectedRoute>
              <ProductDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Customer-only Routes */}
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Cart />
            </ProtectedRoute>
          }
        />

        {/* Supplier-only Routes */}
        <Route
          path="/supplier-dashboard"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <SupplierDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-product"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-products"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <ManageProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-orders"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store-settings"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <StoreSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-store"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <StoreCreationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-product/:productId"
          element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <EditProduct />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect based on auth status */}
        <Route 
          path="*" 
          element={
            <Navigate to={isAuthenticated ? "/home" : "/"} replace />
          } 
        />
      </Routes>
      <Footer />
      <ToastContainer />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
