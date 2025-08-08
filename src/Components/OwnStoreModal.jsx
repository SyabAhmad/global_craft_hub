import React from 'react';

const OwnStoreModal = ({ isOpen, onClose, onManageProducts, onBrowseProducts }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Cannot Purchase</h2>
          <p className="text-red-100 mt-2">This is your own product!</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 leading-relaxed">
              🏪 Suppliers cannot purchase products from their own stores.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">What you can do instead:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>✅ Manage your product inventory</li>
              <li>✅ Update product details</li>
              <li>✅ Browse products from other stores</li>
              <li>✅ Place orders from other suppliers</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onManageProducts}
              className="w-full bg-gradient-to-r from-[#d3756b] to-[#c25d52] text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
            >
              📦 Manage My Products
            </button>
            <button
              onClick={onBrowseProducts}
              className="w-full bg-gradient-to-r from-[#e7dcca] to-[#d3c2a8] text-[#5e3023] py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
            >
              🛍️ Browse Other Products
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-500 py-2 px-4 text-sm hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnStoreModal;