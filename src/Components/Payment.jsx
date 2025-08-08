import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, cartItems, totalAmount } = location.state || {};
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper function to get product image URL
  const getProductImageUrl = (product) => {
    const imageField = product.image_url || product.image || product.thumbnail;
    if (imageField) {
      if (imageField.startsWith("/uploads/")) {
        return `http://localhost:5000${imageField}`;
      }
      return imageField;
    }
    return "https://via.placeholder.com/500x500/f5e6d3/5e3023?text=No+Image";
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission - Always successful for testing
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsProcessing(true);
      
      // Show processing toast
      toast.info("Processing your payment...");
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order payload
      const orderPayload = {
        // If it's from cart
        ...(cartItems && {
          items: cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.sale_price || item.price
          })),
          total_amount: totalAmount || 0,
          order_type: 'cart'
        }),
        // If it's a single product order
        ...(order && !cartItems && {
          items: [{
            product_id: order.product_id,
            quantity: order.quantity,
            unit_price: order.sale_price || order.price
          }],
          total_amount: (order.sale_price || order.price) * order.quantity,
          order_type: 'single'
        }),
        // Customer details
        shipping_address: formData.address || "123 Default Street",
        shipping_city: formData.city || "Default City", 
        shipping_phone: formData.phone || "0000000000",
        payment_method: formData.paymentMethod || "Credit Card",
        customer_name: `${formData.firstName || 'Test'} ${formData.lastName || 'Customer'}`,
        customer_email: formData.email || "test@example.com",
        order_notes: "Test order - payment simulation"
      };

      console.log("Creating order with payload:", orderPayload);

      // Send order to backend
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      console.log("Order response:", data);

      if (response.ok && data.success) {
        // Clear cart if this was a cart checkout
        if (cartItems) {
          try {
            await fetch('http://localhost:5000/api/cart/', {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            // Update cart count in navbar
            window.dispatchEvent(new Event('cartUpdated'));
          } catch (cartError) {
            console.error('Error clearing cart:', cartError);
          }
        }

        // Show success message
        toast.success("🎉 Payment successful! Your order has been placed.");
        
        // Redirect to orders page after success
        setTimeout(() => {
          navigate("/orders");
        }, 1500);
        
      } else {
        // Handle specific error for own store (403 status)
        if (response.status === 403 && data.message) {
          showOwnStorePopup(data.message);
          return; // Don't throw error, just show popup and return
        } else {
          throw new Error(data.message || 'Failed to create order');
        }
      }

    } catch (error) {
      console.error("Payment/Order error:", error);
      toast.error("❌ Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Alternative enhanced popup version for the payment page
  const showOwnStorePopup = (message) => {
    // Create custom modal
    const modalHtml = `
      <div id="ownStoreModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        ">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="
              width: 64px;
              height: 64px;
              background: linear-gradient(135deg, #ef4444, #dc2626);
              border-radius: 50%;
              margin: 0 auto 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 32px;
            ">🚫</div>
            <h2 style="margin: 0; color: #5e3023; font-size: 24px; font-weight: bold;">Cannot Order!</h2>
            <p style="margin: 8px 0 0; color: #dc2626;">This is your own store</p>
          </div>
          
          <div style="margin-bottom: 20px; padding: 16px; background: #fef3c7; border-radius: 8px; border: 1px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
              🏪 ${message}
            </p>
          </div>
          
          <div style="margin-bottom: 20px; padding: 16px; background: #dbeafe; border-radius: 8px; border: 1px solid #3b82f6;">
            <h3 style="margin: 0 0 8px; color: #1e40af; font-size: 16px; font-weight: 600;">What you can do:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
              <li>✅ Browse products from other stores</li>
              <li>✅ Manage your own product inventory</li>
              <li>✅ Update your store settings</li>
            </ul>
          </div>
          
          <div style="display: flex; gap: 12px;">
            <button id="browseOthers" style="
              flex: 1;
              background: linear-gradient(135deg, #d3756b, #c25d52);
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              🛍️ Browse Other Stores
            </button>
            <button id="manageProducts" style="
              flex: 1;
              background: linear-gradient(135deg, #e7dcca, #d3c2a8);
              color: #5e3023;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              📦 Manage Products
            </button>
          </div>
          
          <button id="closeModal" style="
            width: 100%;
            background: transparent;
            border: none;
            color: #6b7280;
            padding: 8px;
            margin-top: 12px;
            font-size: 14px;
            cursor: pointer;
          ">Cancel</button>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add event listeners
    document.getElementById('browseOthers').onclick = () => {
      document.getElementById('ownStoreModal').remove();
      navigate('/products');
    };

    document.getElementById('manageProducts').onclick = () => {
      document.getElementById('ownStoreModal').remove();
      navigate('/manage-products');
    };

    document.getElementById('closeModal').onclick = () => {
      document.getElementById('ownStoreModal').remove();
    };

    // Close on backdrop click
    document.getElementById('ownStoreModal').onclick = (e) => {
      if (e.target.id === 'ownStoreModal') {
        document.getElementById('ownStoreModal').remove();
      }
    };
  };

  // Check if we have valid order data
  const hasValidOrder = (order && order.product_id) || (cartItems && cartItems.length > 0);

  if (!hasValidOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fff9f5]">
        <div className="text-center bg-white rounded-xl shadow-md border border-[#e7dcca] p-6 max-w-md">
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
            No Order Found
          </h3>
          <p className="text-[#8c5f53] mb-4">
            Please select a product or add items to cart to proceed with payment.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  let subtotal = 0;
  let items = [];

  if (cartItems) {
    items = cartItems;
    subtotal = totalAmount || cartItems.reduce((sum, item) => 
      sum + (item.sale_price || item.price) * item.quantity, 0
    );
  } else if (order) {
    items = [order];
    subtotal = (order.sale_price || order.price) * order.quantity;
  }

  const deliveryFee = subtotal > 5000 ? 0 : 200; // Free delivery over Rs. 5000
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-[#fff9f5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-[#e7dcca] mt-20">
        <div className="p-6 lg:p-10">
          <h1 className="text-3xl font-bold text-[#5e3023] mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-[#f5e6d3] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[#5e3023] mb-4">
                Order Summary
              </h2>
              
              {/* Items List */}
              <div className="space-y-4 mb-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <img
                      src={getProductImageUrl(item)}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg bg-[#f5f5f5]"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/500x500/f5e6d3/5e3023?text=No+Image";
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#5e3023] text-sm">
                        {item.name}
                      </h3>
                      <p className="text-[#8c5f53] text-sm">
                        Qty: {item.quantity} × {formatPrice(item.sale_price || item.price)}
                      </p>
                      {item.store_name && (
                        <p className="text-xs text-[#8c5f53]">From: {item.store_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#5e3023]">
                        {formatPrice((item.sale_price || item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-[#e7dcca] pt-4 space-y-2">
                <div className="flex justify-between text-[#8c5f53]">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#8c5f53]">
                  <span>Delivery Fee:</span>
                  <span>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#5e3023] border-t border-[#e7dcca] pt-2">
                  <span>Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {deliveryFee === 0 && (
                  <p className="text-xs text-green-600">🎉 You qualified for free delivery!</p>
                )}
              </div>
            </div>

            {/* Payment Form */}
            <div>
              <h2 className="text-xl font-semibold text-[#5e3023] mb-4">
                Payment Details
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-blue-700 text-sm">
                  💡 <strong>Demo Mode:</strong> Enter any details to complete your order. No real payment will be processed.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#5e3023] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b] text-[#5e3023]"
                    placeholder="John Doe (any name works)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#5e3023] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b] text-[#5e3023]"
                    placeholder="test@example.com (any email works)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#5e3023] mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b] text-[#5e3023]"
                    placeholder="123 Sweet St, Bakery City (any address works)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#5e3023] mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b] text-[#5e3023]"
                    placeholder="1234 5678 9012 3456 (demo card)"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#5e3023] mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b] text-[#5e3023]"
                      placeholder="12/25"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#5e3023] mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b] text-[#5e3023]"
                      placeholder="123"
                    />
                  </div>
                </div>
                
                {/* Always enabled payment button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-[#d3756b] to-[#c25d52] hover:from-[#c25d52] hover:to-[#b54842] text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    `💳 Complete Payment - ${formatPrice(total)}`
                  )}
                </button>
                
                <p className="text-xs text-center text-[#8c5f53] mt-2">
                  🔒 This is a demo checkout. No real payment will be processed.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
