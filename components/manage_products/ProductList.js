export default function ProductList({
  recipies,
  handleProductPress,
  handleDeleteProduct,
  addProductsView,
  setAddProductsView,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Products List</h3>
        
        {!addProductsView && (
          <button
            onClick={() => setAddProductsView(true)}
            className="px-3 py-1 border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Add New Product
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {recipies.map((product, i) => (
          <div
            key={product.id}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
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
            <div className="font-medium text-gray-800">{product.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}