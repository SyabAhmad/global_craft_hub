import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userStore, setUserStore] = useState(null);
  const ordersPerPage = 10;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch orders when userRole or currentPage changes
  useEffect(() => {
    if (userRole) {
      fetchOrders();
    }
  }, [userRole, currentPage]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view orders');
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
        setUserRole(data.user.role);
        
        // If supplier, fetch their store info
        if (data.user.role === 'supplier') {
          await fetchSupplierStore();
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchSupplierStore = async () => {
    try {
      const token = localStorage.getItem('token');
      const storeResponse = await fetch('http://localhost:5000/api/stores/check', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        if (storeData.hasStore && storeData.store) {
          setUserStore(storeData.store);
        }
      }
    } catch (error) {
      console.error('Error fetching supplier store:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view orders');
        return;
      }

      console.log('DEBUG: Fetching orders for user role:', userRole);

      let url;
      
      // Use different endpoints based on user role
      if (userRole === 'supplier') {
        // For suppliers, use the supplier orders endpoint
        url = `http://localhost:5000/api/orders/supplier?page=${currentPage}&limit=${ordersPerPage}`;
      } else {
        // For customers, use the regular orders endpoint
        url = `http://localhost:5000/api/orders?page=${currentPage}&limit=${ordersPerPage}`;
      }

      console.log('DEBUG: Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('DEBUG: Orders response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG: Orders data:', data);
        
        setOrders(data.orders || []);
        if (data.pagination) {
          setTotalPages(data.pagination.total_pages || data.pagination.pages || 1);
        }
        
        // If supplier and no orders found, show helpful message
        if (userRole === 'supplier' && data.orders.length === 0) {
          console.log('DEBUG: No orders found for supplier');
        }
      } else {
        const errorData = await response.json();
        console.error('Orders API Error:', errorData);
        toast.error(errorData.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.order_id === orderId ? { ...order, status: newStatus } : order
          )
        );
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG: Order details:', data);
        setSelectedOrder(data.order);
      } else {
        const errorData = await response.json();
        console.error('Order details error:', errorData);
        toast.error('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
    }
  };

  const openOrderDetails = (order) => {
    fetchOrderDetails(order.order_id);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff9f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d3756b] mx-auto"></div>
          <p className="mt-4 text-[#8c5f53]">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Show message for suppliers without store
  if (userRole === 'supplier' && userStore === null) {
    return (
      <div className="min-h-screen bg-[#fff9f5] py-8 px-4">
        <ToastContainer />
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-[#e7dcca] mt-20">
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-[#5e3023] mb-4">No Store Found</h2>
            <p className="text-[#8c5f53] mb-6">
              You need to create a store to view orders. Please set up your store first.
            </p>
            <button
              onClick={() => window.location.href = '/create-store'}
              className="bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Create Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff9f5] py-8 px-4">
      <ToastContainer />
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-[#e7dcca] mt-20">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-[#5e3023]">
                {userRole === 'supplier' ? 'Store Orders' : 'My Orders'}
              </h2>
              {userRole === 'supplier' && userStore && (
                <p className="text-[#8c5f53] mt-1">Orders for {userStore.name}</p>
              )}
            </div>
            <div className="text-sm text-[#8c5f53] bg-[#f5e6d3] px-4 py-2 rounded-lg">
              Total: {orders.length} orders
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-[#e7dcca] text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-[#5e3023] mb-2">No orders found</h3>
              <p className="text-[#8c5f53]">
                {userRole === 'supplier' 
                  ? "You haven't received any orders yet. Once customers place orders for your products, they will appear here." 
                  : "You haven't placed any orders yet. Start shopping to see your orders here."}
              </p>
              {userRole !== 'supplier' && (
                <button
                  onClick={() => window.location.href = '/products'}
                  className="mt-4 bg-[#d3756b] hover:bg-[#c25d52] text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Start Shopping
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f5e6d3]">
                      <th className="px-4 py-3 font-semibold text-[#5e3023]">Order ID</th>
                      {userRole === 'supplier' && (
                        <th className="px-4 py-3 font-semibold text-[#5e3023]">Customer</th>
                      )}
                      {userRole === 'customer' && (
                        <th className="px-4 py-3 font-semibold text-[#5e3023]">Store</th>
                      )}
                      <th className="px-4 py-3 font-semibold text-[#5e3023]">Date</th>
                      <th className="px-4 py-3 font-semibold text-[#5e3023]">Total</th>
                      <th className="px-4 py-3 font-semibold text-[#5e3023]">Status</th>
                      <th className="px-4 py-3 font-semibold text-[#5e3023]">Payment</th>
                      <th className="px-4 py-3 font-semibold text-[#5e3023]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.order_id} className="border-t border-[#e7dcca] hover:bg-[#fff9f5]">
                        <td className="px-4 py-3 font-mono text-sm text-[#5e3023]">
                          {order.order_id.substring(0, 8)}...
                        </td>
                        {userRole === 'supplier' && (
                          <td className="px-4 py-3 text-[#5e3023]">
                            <div>
                              <div className="font-medium">{order.customer_name || 'Unknown Customer'}</div>
                              {order.customer_email && (
                                <div className="text-xs text-[#8c5f53]">{order.customer_email}</div>
                              )}
                            </div>
                          </td>
                        )}
                        {userRole === 'customer' && (
                          <td className="px-4 py-3 text-[#5e3023]">
                            {order.store_name || 'Unknown Store'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-[#8c5f53]">
                          {formatDate(order.date_created)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#5e3023]">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          {userRole === 'supplier' ? (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                              className="px-3 py-1 rounded-full border border-[#e7dcca] focus:outline-none focus:ring-2 focus:ring-[#d3756b] text-sm bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.payment_status)}`}>
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="px-4 py-2 bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white hover:from-[#c25d52] hover:to-[#b54842] rounded-lg font-medium text-sm transition duration-200"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-[#d3756b] text-white'
                            : 'bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e7dcca]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#5e3023]">
                Order Details - {selectedOrder.order_id.substring(0, 8)}...
              </h3>
              <button
                onClick={closeOrderDetails}
                className="text-[#8c5f53] hover:text-[#5e3023] text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-3 text-[#5e3023]">Order Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Order ID:</strong> {selectedOrder.order_id}</p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.date_created)}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </p>
                  <p><strong>Payment Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.payment_status)}`}>
                      {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                    </span>
                  </p>
                  {selectedOrder.payment_method && (
                    <p><strong>Payment Method:</strong> {selectedOrder.payment_method}</p>
                  )}
                  {userRole === 'supplier' && (
                    <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                  )}
                  {userRole === 'customer' && (
                    <p><strong>Store:</strong> {selectedOrder.store_name}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-[#5e3023]">Shipping Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Address:</strong> {selectedOrder.shipping_address}</p>
                  <p><strong>City:</strong> {selectedOrder.shipping_city}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shipping_phone}</p>
                </div>
              </div>
            </div>

            {selectedOrder.order_notes && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2 text-[#5e3023]">Order Notes</h4>
                <p className="text-sm bg-[#f5e6d3] p-3 rounded-lg">{selectedOrder.order_notes}</p>
              </div>
            )}

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-[#5e3023]">Items Ordered</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-[#e7dcca]">
                    <thead>
                      <tr className="bg-[#f5e6d3]">
                        <th className="border border-[#e7dcca] px-3 py-2 text-left">Product</th>
                        <th className="border border-[#e7dcca] px-3 py-2 text-center">Quantity</th>
                        <th className="border border-[#e7dcca] px-3 py-2 text-right">Unit Price</th>
                        <th className="border border-[#e7dcca] px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-[#e7dcca] px-3 py-2">
                            <div>
                              <div className="font-medium">{item.product_name || item.name}</div>
                              {item.description && (
                                <div className="text-xs text-[#8c5f53] mt-1">{item.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="border border-[#e7dcca] px-3 py-2 text-center">{item.quantity}</td>
                          <td className="border border-[#e7dcca] px-3 py-2 text-right">
                            {formatCurrency(item.unit_price || item.price)}
                          </td>
                          <td className="border border-[#e7dcca] px-3 py-2 text-right font-medium">
                            {formatCurrency(item.total_price || (item.quantity * (item.unit_price || item.price)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="border-t border-[#e7dcca] pt-4">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-[#8c5f53]">
                  {selectedOrder.loyalty_points_used > 0 && (
                    <p>Loyalty Points Used: {selectedOrder.loyalty_points_used}</p>
                  )}
                  {selectedOrder.loyalty_points_earned > 0 && (
                    <p>Loyalty Points Earned: {selectedOrder.loyalty_points_earned}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#5e3023]">
                    Total: {formatCurrency(selectedOrder.total_amount)}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeOrderDetails}
                  className="px-6 py-2 bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;