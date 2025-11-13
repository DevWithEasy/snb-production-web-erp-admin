export default function EditProductModal({
  editModalVisible,
  setEditModalVisible,
  editName,
  setEditName,
  updateProductName,
  loading
}) {
  if (!editModalVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md transition-colors duration-300">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Edit Product Name</h2>
        </div>
        
        <div className="p-6">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter new product name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mb-4 transition-colors duration-200"
          />
          
          <div className="flex gap-3">
            <button
              onClick={() => setEditModalVisible(false)}
              className="flex-1 py-2 px-4 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={updateProductName}
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
                loading 
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" 
                  : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}