'use client';

import { useState } from 'react';

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

  const handleRemove = (item) => {
    setBatch(item.batch.toString());
    setCarton(item.carton.toString());
    setProduct(products.find((p) => p.id === item.id));
    setConsumption((prev) => prev.filter((i) => i.id !== item.id));
    setShowConfirm(false);
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
            <span className="w-15 text-center font-semibold">Batch</span>
            <span className="w-15 text-center font-semibold">Carton</span>
          </div>
          
          {consumption.map((item, index) => {
            const isLastItem = index === consumption.length - 1;
            return (
              <div
                key={index}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowConfirm(true);
                }}
                className={`flex justify-between items-center p-3 ${
                  !isLastItem ? 'border-b border-gray-200' : ''
                } hover:bg-gray-50 cursor-pointer`}
              >
                <span className="flex-1">{item?.name}</span>
                <span className="w-15 text-center">{item?.batch}</span>
                <span className="w-15 text-center">{item?.carton}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Remove Item</h3>
            <p className="mb-6">Remove this item from the list?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(consumption.find(item => item))}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}