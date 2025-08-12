import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    category_id: "",
    store_id: "",
    priceMin: "",
    priceMax: "",
    sortBy: "newest",
    is_featured: "",
  });

  // Mobile filters toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch products with filters and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        params.append("page", currentPage);
        params.append("limit", 12);

        if (filters.category_id)
          params.append("category_id", filters.category_id);
        if (filters.store_id) params.append("store_id", filters.store_id);
        if (filters.search) params.append("search", filters.search);
        if (filters.priceMin) params.append("price_min", filters.priceMin);
        if (filters.priceMax) params.append("price_max", filters.priceMax);
        if (filters.is_featured)
          params.append("is_featured", filters.is_featured);

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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/categories");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.categories || []);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch featured/popular stores (you might want to add this endpoint)
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/stores/top-stores?limit=100"); // Get more stores
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStores(data.stores || []);
          }
        }
      } catch (err) {
        console.error("Error fetching stores:", err);
      }
    };

    fetchStores();
  }, []); // Remove dependency on products

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  // Handle search
  const handleSearchChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }));
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      category_id: "",
      store_id: "",
      priceMin: "",
      priceMax: "",
      sortBy: "newest",
      is_featured: "",
    });
    setCurrentPage(1);
  };

  // Pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  // Helper functions
  const getProductImageUrl = (product) => {
    // Check if product has image_url and it's not null/empty
    if (product.image_url && product.image_url.trim() !== "") {
      // If it's a relative path, make it absolute
      if (product.image_url.startsWith("/uploads/")) {
        return `http://localhost:5000${product.image_url}`;
      }
      // If it's already a full URL, return as is
      if (product.image_url.startsWith("http")) {
        return product.image_url;
      }
      // If it's a relative path without leading slash
      return `http://localhost:5000/${product.image_url}`;
    }

    // Fallback to a working placeholder image with product name
    return `https://via.placeholder.com/300x300/f5e6d3/8B4513?text=${encodeURIComponent(
      product.name || "Product"
    )}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("LKR", "Rs.");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#064232] to-[#8c5f53] text-white py-16 px-4 pt-24">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Global Craft Hub</h1>
          <p className="text-xl mb-8 opacity-90">
Discover the finest handcrafted artworks from local artisans.          </p>

          {/* Main Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="Search for arts..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full px-6 py-4 rounded-full text-gray-800 text-lg focus:outline-none focus:ring-4 focus:ring-[#d3756b] shadow-lg"
            />
            <button className="absolute right-2 top-2 bg-[#d3756b] hover:bg-[#c25d52] text-white p-2 rounded-full transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md border border-[#e7dcca] sticky top-4">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden p-4 border-b border-[#e7dcca]">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="w-full flex items-center justify-between bg-[#f5e6d3] hover:bg-[#e7dcca] px-4 py-2 rounded-lg transition-colors"
                >
                  <span className="font-medium text-[#5e3023]">
                    Filters & Categories
                  </span>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      showMobileFilters ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {/* Filter Content */}
              <div
                className={`${
                  showMobileFilters ? "block" : "hidden"
                } lg:block p-6 space-y-6`}
              >
                {/* Quick Stats */}
                <div className="text-center p-4 bg-[#fff9f5] rounded-lg">
                  <h3 className="text-lg font-semibold text-[#5e3023] mb-2">
                    Arts Found
                  </h3>
                  <p className="text-2xl font-bold text-[#d3756b]">
                    {totalProducts}
                  </p>
                </div>

                {/* Categories Filter */}
                <div>
                  <h3 className="text-lg font-semibold text-[#5e3023] mb-3">
                    Categories
                  </h3>
                  <select
                    name="category_id"
                    value={filters.category_id}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option
                        key={category.category_id}
                        value={category.category_id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

{/* Store Filter */}
{stores.length > 0 && (
  <div>
    <h3 className="text-lg font-semibold text-[#5e3023] mb-3">
      Arts Store ({stores.length})
    </h3>
    <select
      name="store_id"
      value={filters.store_id}
      onChange={handleFilterChange}
      className="w-full px-3 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
    >
      <option value="">All Stores</option>
      {stores.map((store) => (
        <option key={store.store_id} value={store.store_id}>
          {store.name} {store.city && `(${store.city})`} 
          {/* {store.product_count && ` - ${store.product_count} products`} */}
        </option>
      ))}
    </select>
  </div>
)}

                {/* Price Range */}
                <div>
                  <h3 className="text-lg font-semibold text-[#5e3023] mb-3">
                    Price Range
                  </h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="priceMin"
                        placeholder="Min"
                        value={filters.priceMin}
                        onChange={handleFilterChange}
                        className="w-1/2 px-3 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                      />
                      <input
                        type="number"
                        name="priceMax"
                        placeholder="Max"
                        value={filters.priceMax}
                        onChange={handleFilterChange}
                        className="w-1/2 px-3 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                      />
                    </div>
                  </div>
                </div>

                {/* Featured Products */}
                <div>
                  <h3 className="text-lg font-semibold text-[#5e3023] mb-3">
                    Special
                  </h3>
                  <select
                    name="is_featured"
                    value={filters.is_featured}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                  >
                    <option value="">All Products</option>
                    <option value="true">Featured Only</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <h3 className="text-lg font-semibold text-[#5e3023] mb-3">
                    Sort By
                  </h3>
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                    <option value="nameAsc">Name: A to Z</option>
                    <option value="nameDesc">Name: Z to A</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <button
                  onClick={resetFilters}
                  className="w-full bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#5e3023]">
                  {filters.search
                    ? `Search Results for "${filters.search}"`
                    : "All Products"}
                </h2>
                <p className="text-[#8c5f53] mt-1">
                  {totalProducts} products found
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
                <p className="text-[#8c5f53]">Loading artistic creations...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4 max-w-md mx-auto">
                  <h3 className="font-semibold mb-2">
                    Oops! Something went wrong
                  </h3>
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
                  Try adjusting your search or filters to find what you're
                  looking for.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-[#d3756b] hover:bg-[#c25d52] text-white rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <Link
                      to={`/product/${product.product_id}`}
                      key={product.product_id}
                      className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-[#e7dcca]"
                    >
                      <div className="relative overflow-hidden bg-[#f5f5f5]">
                        <img
                          src={getProductImageUrl(product)}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Use a more reliable fallback with product name
                            e.target.src = `https://via.placeholder.com/300x300/f5e6d3/8B4513?text=${encodeURIComponent(
                              product.name || "Product"
                            )}`;
                          }}
                        />

                        {/* Featured Badge */}
                        {product.is_featured && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-[#d3756b] text-white text-xs px-2 py-1 rounded-full font-medium">
                              ★ Featured
                            </span>
                          </div>
                        )}

                        {/* Sale Badge */}
                        {product.sale_price && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Sale
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-[#5e3023] mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-[#8c5f53] mb-2 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Price Section */}
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            {product.sale_price ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-[#d3756b]">
                                  {formatPrice(product.sale_price)}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(product.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-[#5e3023]">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Store and Category Info */}
                        <div className="flex justify-between items-center text-xs text-[#8c5f53]">
                          <span className="font-medium">
                            {product.store_name}
                          </span>
                          <span className="bg-[#fff9f5] px-2 py-1 rounded">
                            {product.category_name}
                          </span>
                        </div>

                        {/* Stock Indicator */}
                        <div className="mt-2">
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
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-10">
                    <nav className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-lg border border-[#e7dcca] bg-white hover:bg-[#f5e6d3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>

                      {/* Page Numbers */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              className={`px-3 py-2 rounded-lg transition-colors ${
                                currentPage === pageNumber
                                  ? "bg-[#d3756b] text-white"
                                  : "border border-[#e7dcca] bg-white hover:bg-[#f5e6d3]"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        }
                      )}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-lg border border-[#e7dcca] bg-white hover:bg-[#f5e6d3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
