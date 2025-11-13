import formatNumber from "../../utils/formatNumber";

export default function ProductView({ products }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 overflow-hidden transition-colors duration-300">
      <div className="bg-blue-500 dark:bg-blue-600 text-white p-2">
        <h3 className="text-base font-bold">Products</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-50 dark:bg-blue-900/30">
            <tr>
              <th className="p-3 text-left font-semibold text-blue-800 dark:text-blue-300 text-sm">Sl</th>
              <th className="p-3 text-left font-semibold text-blue-800 dark:text-blue-300 text-sm">Name</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Carton Weight</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Total Batch</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Total Carton</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Total Weight</th>
            </tr>
          </thead>
          <tbody>
            {products && products.length > 0 ? (
              products.map((product, i) => (
                <tr key={product.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">{i + 1}</td>
                  <td className="p-3 text-gray-800 dark:text-gray-200 font-medium text-sm">{product?.name}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(product?.carton_weight)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{product?.total_batch}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{product?.total_carton}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(product?.total_carton_weight)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No products available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}