import formatNumber from "../../utils/formatNumber";

export default function ProductView({ products }) {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="bg-blue-500 text-white p-4">
        <h3 className="text-lg font-bold">Products</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-3 text-left font-semibold text-blue-800">Sl</th>
              <th className="p-3 text-left font-semibold text-blue-800">Name</th>
              <th className="p-3 text-center font-semibold text-blue-800">Carton Weight</th>
              <th className="p-3 text-center font-semibold text-blue-800">Total Batch</th>
              <th className="p-3 text-center font-semibold text-blue-800">Total Carton</th>
              <th className="p-3 text-center font-semibold text-blue-800">Total Weight</th>
            </tr>
          </thead>
          <tbody>
            {products && products.length > 0 ? (
              products.map((product, i) => (
                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{i + 1}</td>
                  <td className="p-3 text-gray-800 font-medium">{product?.name}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(product?.carton_weight)}</td>
                  <td className="p-3 text-center text-gray-600">{product?.total_batch}</td>
                  <td className="p-3 text-center text-gray-600">{product?.total_carton}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(product?.total_carton_weight)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
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