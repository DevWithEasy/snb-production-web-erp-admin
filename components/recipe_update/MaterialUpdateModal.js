export default function MaterialUpdateModal({
  editModalVisible,
  setEditModalVisible,
  materials,
  editMaterial,
  setEditMaterial,
  handleSaveEditMaterial,
}) {
  if (!editModalVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/70 flex justify-center items-center z-50 p-4 transition-colors duration-300"
      onClick={() => setEditModalVisible(false)}
    >
      <div 
        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-xl transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center">Edit Material</h3>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Material Name Display */}
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-lg font-semibold text-gray-800 dark:text-white text-center">
              {materials?.find((m) => m.id === editMaterial.id)?.name || "Unknown Material"}
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Unit Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Unit
              </label>
              <select
                value={editMaterial.unit}
                onChange={(e) => {
                  setEditMaterial((prev) => ({
                    ...prev,
                    unit: e.target.value,
                  }));
                }}
                className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 text-gray-900 dark:text-white"
              >
                <option value="kg">Kg</option>
                <option value="pcs">Pcs</option>
                <option value="rim">Rim</option>
              </select>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity
              </label>
              <input
                type="text"
                className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
                value={editMaterial.qty}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setEditMaterial((prev) => ({
                      ...prev,
                      qty: value,
                    }));
                  }
                }}
              />
            </div>

            {/* Carton Quantity Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Carton Qty
              </label>
              <input
                type="text"
                className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
                value={editMaterial.cartonQty}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setEditMaterial((prev) => ({
                      ...prev,
                      cartonQty: value,
                    }));
                  }
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              className="flex-1 py-3 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg hover:bg-red-600 dark:hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              onClick={() => setEditModalVisible(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-3 bg-blue-500 dark:bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              onClick={handleSaveEditMaterial}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}