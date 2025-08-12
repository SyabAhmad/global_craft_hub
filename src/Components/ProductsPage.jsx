import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import { cartService } from '../services/cartService';
import 'react-toastify/dist/ReactToastify.css';

const ProductsPage = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState({
    category: "",
    priceMin: "",
    priceMax: "",
    sortBy: "newest",
    search: "",
  });

  // Fetch products with filters and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        params.append("page", currentPage);
        params.append("limit", 12); // Set items per page

        if (filters.category) params.append("category_id", filters.category);
        if (filters.search) params.append("search", filters.search);
        if (filters.priceMin) params.append("price_min", filters.priceMin);
        if (filters.priceMax) params.append("price_max", filters.priceMax);

        // Map sort options to API parameters
        const sortMapping = {
          newest: "date_desc",
          oldest: "date_asc",
          priceAsc: "price_asc",
          priceDesc: "price_desc",
          nameAsc: "name_asc",
          nameDesc: "name_desc",
        };

        params.append("sort", sortMapping[filters.sortBy] || "date_desc");

        // Make API request
        const response = await fetch(
          `http://localhost:5000/api/products?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setProducts(data.products || []);
          setTotalProducts(data.pagination?.total || 0);
          setTotalPages(data.pagination?.pages || 1);
        } else {
          throw new Error(data.message || "Failed to fetch products");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, filters]);

  // Fetch categories separately (only once)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/categories");

        if (!response.ok) {
          console.error("Failed to fetch categories:", response.status);
          return;
        }

        const data = await response.json();

        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        // Continue without categories if there's an error
      }
    };

    fetchCategories();
  }, []); // Only run once on mount

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      category: "",
      priceMin: "",
      priceMax: "",
      sortBy: "newest",
      search: "",
    });
    setCurrentPage(1);
  };

  // Pagination controls
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  // Helper function to get product image URL
  const getProductImageUrl = (product) => {
    // Check if product has image_url (from primary image in product_images table)
    if (product.image_url) {
      // If it's a relative path, make it absolute
      if (product.image_url.startsWith("/uploads/")) {
        return `http://localhost:5000${product.image_url}`;
      }
      return product.image_url;
    }

    // Fallback to placeholder
    return "https://via.placeholder.com/300x300/f5e6d3/5e3023?text=No+Image";
  };

  // Helper function to format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("LKR", "Rs.");
  };

  // Add to cart handler
  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to add items to cart");
        navigate("/login");
        return;
      }

      // Check if product is in stock
      if (product.stock_quantity <= 0) {
        toast.error("Product is out of stock");
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading("Adding to cart...");

      // Add to cart using the service
      const response = await cartService.addToCart(product.product_id, 1);

      if (response.success) {
        toast.dismiss(loadingToast);
        toast.success(response.message || `${product.name} added to cart!`);
        
        // You can also dispatch an event or update a global cart state here
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.dismiss(loadingToast);
        toast.error(response.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error.message || "Failed to add item to cart");
    }
  };

  // Add to wishlist handler
  const handleAddToWishlist = async (product) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to add items to wishlist");
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.product_id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Product added to wishlist!");
      } else {
        toast.error(data.message || "Failed to add to wishlist");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add to wishlist");
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
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
      
      <div className="max-w-7xl mx-auto mt-10">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#064232]">Artful Treasures</h1>
          <p className="text-[#064232] mt-2">
            Browse our exquisite handcrafted art pieces
          </p>
          {totalProducts > 0 && (
            <p className="text-sm text-[#064232] mt-1">
              {totalProducts} Arts found
            </p>
          )}
        </div>

        {/* Filters and Search Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-[#e7dcca]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="w-full md:w-1/3">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search products..."
                className="w-full px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
              >
                <option value="newest">Newest First</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="nameAsc">Name: A to Z</option>
                <option value="nameDesc">Name: Z to A</option>
              </select>

              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#5e3023]">Price Range:</span>
              <input
                type="number"
                name="priceMin"
                value={filters.priceMin}
                onChange={handleFilterChange}
                placeholder="Min"
                className="w-24 px-3 py-1 rounded border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
              />
              <span>-</span>
              <input
                type="number"
                name="priceMax"
                value={filters.priceMax}
                onChange={handleFilterChange}
                placeholder="Max"
                className="w-24 px-3 py-1 rounded border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
            <p className="text-[#8c5f53]">Loading artistic creations....</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4 max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Oops! Something went wrong</h3>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="px-6 py-2 bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Products Found */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-[#e7dcca]">
            <svg
              className="mx-auto h-16 w-16 text-[#e7dcca] mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-xl font-semibold text-[#5e3023] mb-2">
              No Arts found
            </h3>
            <p className="text-[#8c5f53] mb-4">
              {filters.search ||
              filters.category ||
              filters.priceMin ||
              filters.priceMax
                ? "Try adjusting your filters or search terms"
                : "No products are currently available"}
            </p>
            {(filters.search ||
              filters.category ||
              filters.priceMin ||
              filters.priceMax) && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.product_id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link
                  to={`/product/${product.product_id}`}
                  className="block"
                  style={{ color: "#5e3023" }}
                >
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/300x300/f5e6d3/5e3023?text=No+Image";
                    }}
                  />
                </Link>

                <div className="p-4">
                  <Link
                    to={`/product/${product.product_id}`}
                    style={{ color: "#064232" }}
                    className="hover:underline"
                  >
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                  </Link>

                  <p className="text-[#064232] text-sm mb-3 line-clamp-2 flex-1">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    {product.sale_price ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-[#064232]">
                          Rs. {product.sale_price}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          Rs. {product.price}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-[#064232]">
                        Rs. {product.price}
                      </span>
                    )}
                  </div>

                  {/* Store and Category Info */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#8c5f53] mb-3">
                    <span className="font-medium">{product.store_name}</span>
                    <span className="bg-[#fff9f5] px-2 py-1 rounded">
                      {product.category_name}
                    </span>
                  </div>

                  {/* Stock Indicator */}
                  {product.stock_quantity !== undefined && (
                    <div className="mb-3">
                      {product.stock_quantity > 0 ? (
                        <span className="text-xs text-green-600">
                          {product.stock_quantity} in stock
                        </span>
                      ) : (
                        <span className="text-xs text-red-500">
                          Out of stock
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.stock_quantity <= 0}
                      className="flex-1 bg-[#d3756b] hover:bg-[#c25d52] text-white py-2 px-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Cart
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToWishlist(product);
                      }}
                      className="bg-white border border-[#d3756b] text-[#d3756b] hover:bg-[#d3756b] hover:text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center mt-10">
            <nav className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border rounded disabled:opacity-50"
                style={{
                  borderColor: "#5e3023",
                  color: currentPage === 1 ? "#gray" : "#5e3023",
                }}
              >
                Previous
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 border rounded ${
                    currentPage === page
                      ? "bg-[#5e3023] text-white"
                      : "hover:bg-gray-100"
                  }`}
                  style={{
                    borderColor: "#5e3023",
                    color: currentPage === page ? "white" : "#5e3023",
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border rounded disabled:opacity-50"
                style={{
                  borderColor: "#5e3023",
                  color: currentPage === totalPages ? "gray" : "#5e3023",
                }}
              >
                Next
              </button>
            </nav>

            {/* Page Info */}
            <div className="ml-4 text-sm text-[#8c5f53] self-center">
              Page {currentPage} of {totalPages} ({totalProducts} total
              Arts)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
