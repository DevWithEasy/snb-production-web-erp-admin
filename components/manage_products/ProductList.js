export default function ProductList({
  recipies,
  handleProductPress,
  handleDeleteProduct,
  addProductsView,
  setAddProductsView,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-white">Products List</h3>
        
        {!addProductsView && (
          <button
            onClick={() => setAddProductsView(true)}
            className="px-3 py-1 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
          >
            Add New Product
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {recipies.map((product, i) => (
          <div
            key={product.id}
            className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
              i === 0 ? "rounded-t-lg" : ""
            } ${
              i === recipies.length - 1 ? "rounded-b-lg border-b-0" : ""
            }`}
            onClick={() => handleProductPress(product)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleDeleteProduct(product);
            }}
          >
            <div className="font-medium text-gray-800 dark:text-white">{product.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}