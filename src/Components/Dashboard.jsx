import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import SupplierDashboard from "./SupplierDashboard";
const Dashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Render appropriate dashboard based on user role
  if (currentUser.role === "supplier") {
    return <SupplierDashboard user={currentUser} />;
  } else {
    return <CustomerDashboard user={currentUser} />;
  }
};

// Customer dashboard component
const CustomerDashboard = ({ user }) => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-[#5e3023] mb-6">
          Welcome, {user.first_name}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary Card */}
          <div className="bg-[#fff9f5] p-5 rounded-lg border border-[#e7dcca]">
            <h2 className="text-xl font-semibold text-[#5e3023] mb-3">
              Your Orders
            </h2>
            <p className="text-[#8c5f53] mb-2">
              Recent orders: <span className="font-bold">0</span>
            </p>
            <p className="text-[#8c5f53] mb-4">
              Pending deliveries: <span className="font-bold">0</span>
            </p>
            <button className="text-[#d3756b] hover:text-[#c25d52] font-medium">
              View all orders →
            </button>
          </div>

          {/* Loyalty Points Card */}
          <div className="bg-[#fff9f5] p-5 rounded-lg border border-[#e7dcca]">
            <h2 className="text-xl font-semibold text-[#5e3023] mb-3">
              Loyalty Points
            </h2>
            <div className="mb-4">
              <span className="text-3xl font-bold text-[#d3756b]">
                {user.loyalty_points || 0}
              </span>
              <span className="text-[#8c5f53] ml-2">points</span>
            </div>
            <button className="text-[#d3756b] hover:text-[#c25d52] font-medium">
              Redeem points →
            </button>
          </div>

          {/* Wishlist Card */}
          <div className="bg-[#fff9f5] p-5 rounded-lg border border-[#e7dcca]">
            <h2 className="text-xl font-semibold text-[#5e3023] mb-3">
              Your Wishlist
            </h2>
            <p className="text-[#8c5f53] mb-4">
              Items in wishlist: <span className="font-bold">0</span>
            </p>
            <button className="text-[#d3756b] hover:text-[#c25d52] font-medium">
              View wishlist →
            </button>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-[#5e3023] mb-4">
            Recent Activity
          </h2>
          <div className="bg-[#fff9f5] p-5 rounded-lg border border-[#e7dcca]">
            <p className="text-[#8c5f53] italic">
              No recent activity to display.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// // Supplier dashboard component
// const SupplierDashboard = ({ user }) => {
//   return (
//     <div className="container mx-auto py-8 px-4">
//       <div className="bg-white rounded-lg shadow-md p-6">
//         <h1 className="text-2xl font-bold text-[#5e3023] mb-2">Supplier Dashboard</h1>
//         <p className="text-[#8c5f53] mb-6">
//           Welcome back, {user.business_name || `${user.first_name} ${user.last_name}`}!
//         </p>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {/* Store Status Card */}
//           <div className="bg-[#fff9f5] p-5 rounded-lg border border-[#e7dcca]">
//             <h2 className="text-xl font-semibold text-[#5e3023] mb-3">Store Status</h2>
//             <p className="text-[#8c5f53] mb-2">
//               Verification:
//               <span className={`font-bold ml-2 ${user.is_verified ? 'text-green-600' : 'text-amber-600'}`}>
//                 {user.is_verified ? 'Verified' : 'Pending'}
//               </span>
//             </p>
//             <button className="mt-3 text-[#d3756b] hover:text-[#c25d52] font-medium">
//               Manage store →
//             </button>
//           </div>

//           {/* Orders Card */}
//           <div className="bg-[#fff9f5] p-5 rounded-lg border border-[#e7dcca]">
//             <h2 className="text-xl font-semibold text-[#5e3023] mb-3">Orders</h2>
//             <p className="text-[#8c5f53] mb-2">New orders: <span className="font-bold">0</span></p>
//             <p className="text-[#8c5f53] mb-4">Processing: <span className="font-bold">0</span></p>
//             <button className="text-[#d3756b] hover:text-[#c25d52] font-medium">
//               Manage orders →
//             </button>
//           </div>

//           {/* Products Card */}
//           <div className="bg-[#fff9f5] p-5 rounded-lg border border-[#e7dcca]">
//             <h2 className="text-xl font-semibold text-[#5e3023] mb-3">Products</h2>
//             <p className="text-[#8c5f53] mb-4">Total products: <span className="font-bold">0</span></p>
//             <button className="text-[#d3756b] hover:text-[#c25d52] font-medium">
//               Manage products →
//             </button>
//           </div>
//         </div>

//         {/* Quick Actions Section */}
//         <div className="mt-8">
//           <h2 className="text-xl font-semibold text-[#5e3023] mb-4">Quick Actions</h2>
//           <div className="flex flex-wrap gap-4">
//             <button className="bg-[#d3756b] hover:bg-[#c25d52] text-white px-4 py-2 rounded-full transition-all duration-300">
//               Add New Product
//             </button>
//             <button className="bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] px-4 py-2 rounded-full transition-all duration-300">
//               Update Store Hours
//             </button>
//             <button className="bg-[#e7dcca] hover:bg-[#d3c2a8] text-[#5e3023] px-4 py-2 rounded-full transition-all duration-300">
//               View Analytics
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

export default Dashboard;
