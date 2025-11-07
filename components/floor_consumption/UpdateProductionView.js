'use client';

import { useState } from 'react';
import { FaTrash, FaTimes } from 'react-icons/fa';

export default function UpdateProductionView({
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  const handleRemoveClick = (item, e) => {
    e.stopPropagation(); // Prevent event bubbling
    setItemToRemove(item);
    setShowConfirm(true);
  };

  const handleRemoveConfirm = () => {
    if (itemToRemove) {
      // Set the batch and carton values for editing
      setBatch(itemToRemove.batch.toString());
      setCarton(itemToRemove.carton.toString());
      setProduct(products.find((p) => p.id === itemToRemove.id));
      
      // Remove the item from consumption list
      setConsumption((prev) => prev.filter((i) => i.id !== itemToRemove.id));
    }
    setShowConfirm(false);
    setItemToRemove(null);
  };

  const handleCancelRemove = () => {
    setShowConfirm(false);
    setItemToRemove(null);
  };

  return (
    <div>
      <div className={`p-3 border border-gray-300 rounded-lg ${selectedDate !== "" ? 'block' : 'hidden'}`}>
        <div className="flex justify-between items-center gap-3">
          <div className="flex-1">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-12 border border-gray-300 rounded-lg px-3 bg-white"
            >
              <option value={selectedDate}>
                {selectedDate} {user?.current_period}
              </option>
            </select>
          </div>
          
          {selectedDate !== "" && (
            <button 
              onClick={handleChangeSave}
              disabled={updating}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 h-12 rounded-lg transition-colors disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Change'}
            </button>
          )}
        </div>

        {updating && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700">Consumption By DC Updating...</p>
          </div>
        )}

        {selectedDate === "" && (
          <p className="text-center mt-5 text-gray-600">
            Please select a date to add consumption.
          </p>
        )}

        {selectedDate !== "" && (
          <>
            {products ? (
              <div className="mt-5">
                <div className="mb-4">
                  <select
                    value={product?.id}
                    onChange={(e) => {
                      const selected = products.find((p) => p.id === e.target.value);
                      setProduct(selected);
                    }}
                    className="w-full h-12 border border-gray-300 rounded-lg px-3 bg-white"
                  >
                    {products.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch and Carton */}
                <div className="flex gap-3 mb-4">
                  <input
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="flex-1 h-12 border border-gray-300 rounded-lg px-3"
                    placeholder="Batch"
                    type="number"
                  />
                  <input
                    value={carton}
                    onChange={(e) => setCarton(e.target.value)}
                    className="flex-1 h-12 border border-gray-300 rounded-lg px-3"
                    placeholder="Carton"
                    type="number"
                  />
                </div>

                <button 
                  onClick={addConsumption}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            ) : (
              <p className="text-gray-600">No products data available</p>
            )}
          </>
        )}
      </div>

      {/* Consumption List */}
      {consumption.length > 0 && (
        <div className="border border-gray-300 rounded-lg mt-3">
          <div className="flex justify-between bg-gray-100 p-3 border-b border-gray-300">
            <span className="flex-1 font-semibold">Name</span>
            <span className="w-20 text-center font-semibold">Batch</span>
            <span className="w-20 text-center font-semibold">Carton</span>
            <span className="w-12 text-center font-semibold">Action</span>
          </div>
          
          {consumption.map((item, index) => {
            const isLastItem = index === consumption.length - 1;
            return (
              <div
                key={index}
                className={`flex justify-between items-center p-3 ${
                  !isLastItem ? 'border-b border-gray-200' : ''
                } hover:bg-gray-50 group`}
              >
                <span className="flex-1">{item?.name}</span>
                <span className="w-20 text-center">{item?.batch}</span>
                <span className="w-20 text-center">{item?.carton}</span>
                <div className="w-12 text-center">
                  <button
                    onClick={(e) => handleRemoveClick(item, e)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-red-50"
                    title="Remove item"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Remove Item</h3>
              <button
                onClick={handleCancelRemove}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to remove this item?
              </p>
              {itemToRemove && (
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="font-medium text-gray-800">{itemToRemove.name}</p>
                  <p className="text-sm text-gray-600">
                    Batch: {itemToRemove.batch} | Carton: {itemToRemove.carton}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelRemove}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <FaTrash size={14} />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}