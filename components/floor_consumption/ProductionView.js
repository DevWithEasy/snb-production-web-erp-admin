'use client';

import { useState } from "react";

export default function ProductionView({
  selectedDate,
  setSelectedDate,
  user,
  handleChangeSave,
  products,
  product,
  setProduct,
  batch,
  setBatch,
  carton,
  setCarton,
  addConsumption,
  consumption,
  setConsumption,
  updating,
}) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);

  const handleRemoveItem = (itemId) => {
    setConsumption((prev) => prev.filter((i) => i.id !== itemId));
    setShowRemoveConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Date Selection and Save Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select a Date</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day.toString()}>
                  {day.toString()} {user?.current_period}
                </option>
              ))}
            </select>
          </div>

          {selectedDate !== "" && (
            <div className="w-full sm:w-auto">
              <button
                onClick={handleChangeSave}
                disabled={updating}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : null}
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {updating && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 text-sm">Consumption By DC Updating...</span>
          </div>
        )}

        {selectedDate === "" && (
          <div className="text-center py-8 text-gray-500">
            Please select a date to add consumption.
          </div>
        )}
      </div>

      {/* Product Selection and Inputs */}
      {selectedDate !== "" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {products ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product
                </label>
                <select
                  value={product?.id}
                  onChange={(e) => {
                    const selected = products.find((p) => p.id === e.target.value);
                    setProduct(selected);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {products.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter batch quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carton
                  </label>
                  <input
                    type="text"
                    value={carton}
                    onChange={(e) => setCarton(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter carton quantity"
                  />
                </div>
              </div>

              <button
                onClick={addConsumption}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Consumption
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No products data available
            </div>
          )}
        </div>
      )}

      {/* Consumption List */}
      {consumption.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Added Consumption</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {consumption.map((item, index) => (
              <div
                key={index}
                className="p-4 hover:bg-gray-50 transition-colors"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowRemoveConfirm(item.id);
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-gray-500">
                        Batch: <span className="font-medium">{item.batch}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        Carton: <span className="font-medium">{item.carton}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRemoveConfirm(item.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Remove Item</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove this item from the list?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveItem(showRemoveConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Save Button */}
      {selectedDate !== "" && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
          <button
            onClick={handleChangeSave}
            disabled={updating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {updating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : null}
            {updating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}