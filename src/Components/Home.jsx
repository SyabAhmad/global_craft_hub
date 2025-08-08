import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import craftlogo from "../assets/craftlogo.jpg";
import craftheroimage from "../assets/craftlogo.jpg";

const Home = () => {
  const [stores, setStores] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const carouselRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll interval
  useEffect(() => {
    if (featuredProducts.length > 0) {
      const interval = setInterval(() => {
        setCurrentProductIndex((prevIndex) => 
          prevIndex === featuredProducts.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000); // Change slide every 4 seconds

      return () => clearInterval(interval);
    }
  }, [featuredProducts.length]);

  // Scroll to current product
  useEffect(() => {
    if (carouselRef.current && featuredProducts.length > 0) {
      const productWidth = carouselRef.current.children[0]?.offsetWidth || 0;
      const gap = window.innerWidth < 768 ? 16 : 32; // Smaller gap on mobile
      const scrollPosition = currentProductIndex * (productWidth + gap);
      
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentProductIndex, featuredProducts.length]);

  // Fetch stores from database
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        
        // Fetch stores ordered by product count (top 5)
        const response = await fetch('http://localhost:5000/api/stores/top-stores?limit=5');
        const data = await response.json();
        
        if (data.success) {
          setStores(data.stores || []);
        } else {
          console.error('Failed to fetch stores:', data.message);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Failed to load stores');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  // Fetch featured products from database
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        // Fetch featured products (limit 5 for carousel)
        const response = await fetch('http://localhost:5000/api/products?is_featured=true&limit=5');
        const data = await response.json();
        
        if (data.success) {
          setFeaturedProducts(data.products || []);
        } else {
          console.error('Failed to fetch featured products:', data.message);
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Helper functions
  const getProductImageUrl = (product) => {
    if (product.image_url && product.image_url.trim() !== '') {
      if (product.image_url.startsWith("/uploads/")) {
        return `http://localhost:5000${product.image_url}`;
      }
      if (product.image_url.startsWith("http")) {
        return product.image_url;
      }
      return `http://localhost:5000/${product.image_url}`;
    }
    return "https://via.placeholder.com/300x300/f5e6d3/5e3023?text=No+Image";
  };

  const getStoreImageUrl = (store) => {
    return craftlogo;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price).replace('PKR', 'Rs.');
  };

  // const handlePlayPause = (e) => {
  //   e.stopPropagation();
  //   if (videoRef.current) {
  //     if (isPlaying) {
  //       videoRef.current.pause();
  //     } else {
  //       videoRef.current.play();
  //     }
  //     setIsPlaying(!isPlaying);
  //   }
  // };

  const handlePrevProduct = () => {
    setCurrentProductIndex((prevIndex) => 
      prevIndex === 0 ? featuredProducts.length - 1 : prevIndex - 1
    );
  };

  const handleNextProduct = () => {
    setCurrentProductIndex((prevIndex) => 
      prevIndex === featuredProducts.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleProductDotClick = (index) => {
    setCurrentProductIndex(index);
  };

  return (
    <div className="min-h-screen bg-[#fff9f5] ">
      {/* Hero section - Fixed responsive video */}
      {showVideo ? (
        <div className="relative mb-8 md:mb-12 shadow-lg overflow-hidden ">
          <img src={craftheroimage} alt="craftheroimage" />
          {/* <video
            ref={videoRef}
            className="w-full h-[50vh] md:h-auto object-cover"
            src="src\craftlogo.jpg"
            autoPlay={true}
            muted={true}
            loop={true}
            playsInline={true}
            controls={false}
            preload="auto"
            onError={(e) => console.error("Video error:", e)}
          >
            Your browser does not support the video tag.
          </video> */}

          {/* Play/Pause Button - Responsive */}
          {/* <button
            onClick={handlePlayPause}
            className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center transition-all duration-300 z-10"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 md:h-8 md:w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 md:h-8 md:w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </button> */}

          {/* Overlay Content - Responsive */}
          <div className="absolute inset-0 flex items-center justify-center px-4 mt-14">
            <div className="text-center bg-black/40 p-4 md:p-8 rounded-lg backdrop-blur-sm max-w-3xl w-full">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4">
                Welcome to Global Craft Hub
              </h1>
              <p className="text-sm md:text-xl text-white mb-4 md:mb-6">
                Crafting timeless memories, one masterpiece at a time
              </p>
              <button
                className="bg-[#8c7c68] hover:bg-[#c25d52] text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate("/products")}
              >
                Discover Our Artworks
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[50vh] md:h-96 mb-8 md:mb-12 mx-4 md:mx-0 rounded-lg shadow-lg bg-[#f8e8e0] flex items-center justify-center relative">
          <div className="text-center p-4 md:p-8">
            <h1 className="text-2xl md:text-4xl font-bold text-[#5e3023] mb-2 md:mb-4">
              Welcome to Global Craft Hub
            </h1>
            <p className="text-sm md:text-xl text-[#8c5f53] mb-4 md:mb-6">
              Crafting timeless memories, one masterpiece at a time
            </p>
            <button
              className="bg-[#d3756b] hover:bg-[#c25d52] text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300"
              onClick={() => setShowVideo(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 md:h-5 md:w-5 inline-block mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Show Video
            </button>
          </div>

          {/* Background Image (alternative to video) */}
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1689&q=80"
              alt="Back House Bakery"
              className="w-full h-full object-cover opacity-30"
            />
          </div>
        </div>
      )}

      {/* About section - Responsive */}
      <div className="text-center max-w-4xl mx-auto my-8 md:my-16 px-4">
        <div className="flex items-center justify-center mb-6 md:mb-8">
          <div className="flex-grow border-t border-[#e7dcca] mr-4"></div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#5e3023] uppercase">
            Inspiration Guaranteed
          </h2>
          <div className="flex-grow border-t border-[#e7dcca] ml-4"></div>
        </div>
        <p className="text-[#8c5f53] leading-relaxed text-sm md:text-lg">
           Global Craft Hub is your premier destination for unique and handcrafted art pieces.
We pride ourselves on curating exquisite artworks, decor, and custom creations made with passion and precision. Our skilled artists pour their soul into every piece, using only high-quality materials to ensure each creation tells a story. At Global Craft Hub, every detail is intentional — every artwork, a memorable experience.
          <br />
          <br className="hidden md:block" />
          From custom portrait pieces to elegant wall art, from daily curated collections to special occasion gifts — we offer something to inspire every art lover.
Our commitment to authenticity means every piece is crafted with care, creativity, and uncompromised quality.
          <br />
          <br className="hidden md:block" />
          Visit our studio or explore our online gallery to discover why Global Craft Hub has become the trusted choice for meaningful gifts and everyday inspiration.
        </p>
      </div>

      {/* Featured Products Carousel - Responsive */}
      <div className="max-w-7xl mx-auto mb-8 md:mb-16 px-4">
        <div className="flex items-center justify-center mb-6 md:mb-8">
          <div className="flex-grow border-t border-[#e7dcca] mr-4"></div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#5e3023] uppercase">
            Featured Arts
          </h2>
          <div className="flex-grow border-t border-[#e7dcca] ml-4"></div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
            <p className="text-[#8c5f53]">Loading featured Arts...</p>
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="relative">
            {/* Carousel Container */}
            <div className="relative overflow-hidden">
              {/* Navigation Buttons - Hidden on mobile */}
              <button
                onClick={handlePrevProduct}
                className="hidden md:block absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-[#5e3023] rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
                aria-label="Previous product"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={handleNextProduct}
                className="hidden md:block absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-[#5e3023] rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
                aria-label="Next product"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Products Carousel - Responsive */}
              <div
                ref={carouselRef}
                className="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide px-4 py-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {featuredProducts.map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex-shrink-0 w-64 md:w-80 bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/product/${product.product_id}`)}
                  >
                    <div className="h-48 md:h-64 overflow-hidden relative">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = BakeHouseImage;
                        }}
                      />
                      
                      {/* Featured Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-[#d3756b] text-white text-xs px-2 py-1 rounded-full font-medium">
                          ⭐ Featured
                        </span>
                      </div>

                      {/* Sale Badge */}
                      {product.sale_price && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Sale
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 md:p-6">
                      <h3 className="text-lg md:text-xl font-bold text-[#5e3023] mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-[#8c5f53] mb-3 md:mb-4 line-clamp-2 text-sm">
                        {product.description}
                      </p>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        {product.sale_price ? (
                          <div className="flex items-center gap-2">
                            <span className="text-base md:text-lg font-bold text-[#d3756b]">
                              {formatPrice(product.sale_price)}
                            </span>
                            <span className="text-xs md:text-sm text-gray-500 line-through">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-base md:text-lg font-bold text-[#5e3023]">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>

                      {/* Store name */}
                      <div className="text-xs text-[#8c5f53] mb-3 md:mb-4">
                        <span className="font-medium">
                          {product.store_name || 'Back House'}
                        </span>
                      </div>

                      <button
                        className="w-full bg-[#d3756b] hover:bg-[#c25d52] text-white py-2 rounded-lg font-medium transition-colors text-sm md:text-base"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.product_id}`);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Indicators - Responsive */}
            <div className="flex justify-center mt-6 md:mt-8 space-x-2">
              {featuredProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleProductDotClick(index)}
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                    index === currentProductIndex
                      ? 'bg-[#d3756b] scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to product ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#8c5f53] mb-4">No featured Arts available at the moment.</p>
            <button
              className="bg-[#8c7c68] hover:bg-[#c25d52] text-white px-6 py-3 rounded-lg font-medium transition-colors"
              onClick={() => navigate("/products")}
            >
              Browse All Products
            </button>
          </div>
        )}
      </div>

      {/* Top Stores section - Responsive */}
      <div className="text-center mb-8 md:mb-10 px-4">
        <div className="flex items-center justify-center mb-6 md:mb-8">
          <div className="flex-grow border-t border-[#e7dcca] mr-4"></div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#5e3023] uppercase">
            Top Stores
          </h2>
          <div className="flex-grow border-t border-[#e7dcca] ml-4"></div>
        </div>

        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto mb-4"></div>
              <p className="text-[#8c5f53]">Loading stores...</p>
            </div>
          ) : stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {stores.map((store) => (
                <div
                  key={store.store_id}
                  className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group"
                  onClick={() => navigate(`/store/${store.store_id}`, { state: store })}
                >
                  {/* Image container with fixed height */}
                  <div className="h-48 md:h-64 w-full relative overflow-hidden">
                    <img
                      src={getStoreImageUrl(store)}
                      alt={store.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = BakeHouseImage;
                      }}
                    />
                    
                    {/* Store badge overlay */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-[#8c7c68] text-white text-xs px-2 py-1 rounded-full font-medium">
                        🏪 Top Store
                      </span>
                    </div>
                  </div>

                  {/* Content container */}
                  <div className="bg-white p-4 md:p-6 flex flex-col flex-grow">
                    <h3 className="text-lg md:text-xl font-semibold text-[#5e3023] mb-2">
                      {store.name}
                    </h3>
                    <p className="text-[#8c5f53] mb-2 text-sm">
                      📍 {store.city || store.address || 'Location not specified'}
                    </p>
                    <p className="text-sm text-[#8c5f53] mb-4 line-clamp-2">
                      {store.description || `Welcome to ${store.name}! We offer the finest selection of freshly baked goods and custom treats made with love and premium ingredients.`}
                    </p>
                    
                    {/* Store stats */}
                    <div className="flex items-center justify-between text-sm text-[#8c5f53] mb-4">
                      <span>📦 {store.product_count || 0} Arts</span>
                      <span>⭐ {store.avg_rating ? parseFloat(store.avg_rating).toFixed(1) : '5.0'}</span>
                    </div>
                    
                    {/* Store contact info */}
                    {store.phone && (
                      <div className="text-xs text-[#8c5f53] mb-2">
                        📞 {store.phone}
                      </div>
                    )}
                    
                    <div className="mt-auto">
                      <button
                        className="w-full bg-[#8c7c68] hover:bg-[#c25d52] text-white py-2 md:py-3 rounded-md font-medium transition-colors text-sm md:text-base"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/store/${store.store_id}`, { state: store });
                        }}
                      >
                        View Store
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#8c5f53] mb-4">No stores available at the moment.</p>
              <button
                className="bg-[#8c7c68] hover:bg-[#c25d52] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                onClick={() => navigate("/products")}
              >
                Browse Arts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Testimonial Section - Responsive */}
      <div className="bg-[#f8e8e0] py-8 md:py-12 px-4 md:px-6 rounded-lg my-8 md:my-16 mx-4 md:mx-0">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#5e3023] mb-6 md:mb-10">
            What Our Customers Say
          </h2>

          <div className="relative">
            <svg
              className="absolute top-0 left-0 w-12 h-12 md:w-16 md:h-16 text-[#d3756b] opacity-20 -translate-x-1/2 -translate-y-1/2"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 32 32"
            >
              <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
            </svg>

            <div className="relative">
              <p className="text-base md:text-xl text-[#8c5f53] italic mb-4 md:mb-6">
                "I ordered a custom art piece for my daughter’s birthday, and it was absolutely stunning! Not only was it beautifully crafted, but it truly captured her spirit. Global Craft Hub has become our go-to place for meaningful and artistic gifts."
              </p>
              <div className="flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80"
                  alt="Customer"
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover mr-4"
                />
                <div className="text-left">
                  <h4 className="font-bold text-[#5e3023] text-sm md:text-base">Amina Tahir</h4>
                  <p className="text-xs md:text-sm text-[#8c5f53]">Happy Customer</p>
                </div>
              </div>
            </div>

            <svg
              className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 text-[#d3756b] opacity-20 translate-x-1/2 translate-y-1/2"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 32 32"
            >
              <path d="M14.048 4c4.896 3.456 8.352 9.12 8.352 15.36 0 5.088-3.072 8.064-6.624 8.064-3.36 0-5.856-2.688-5.856-5.856 0-3.168 2.208-5.472 5.088-5.472.576 0 1.344.096 1.536.192-.48-3.264-3.552-7.104-6.624-9.024L14.048 4zm16.512 0c4.8 3.456 8.256 9.12 8.256 15.36 0 5.088-3.072 8.064-6.624 8.064-3.264 0-5.856-2.688-5.856-5.856 0-3.168 2.304-5.472 5.184-5.472.576 0 1.248.096 1.44.192-.48-3.264-3.456-7.104-6.528-9.024L30.56 4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Call to Action - Responsive */}
      <div className="text-center mb-8 md:mb-16 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#5e3023] mb-4">
          Ready to Order?
        </h2>
        <p className="text-[#8c5f53] text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
           Make your moments unforgettable with our handcrafted art pieces.
Order now for delivery or pickup from our studio!
        </p>
        <button
          className="bg-[#8c7c68] hover:bg-[#c25d52] text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-base md:text-lg transition-all duration-300 transform hover:scale-105"
          onClick={() => navigate("/products")}
        >
          Browse Our Arts
        </button>
      </div>
    </div>
  );
};

export default Home;