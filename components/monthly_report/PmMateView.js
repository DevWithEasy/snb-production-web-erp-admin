import formatNumber from "../../utils/formatNumber";

export default function PmMateView({ materials }) {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="bg-blue-500 text-white p-4">
        <h3 className="text-lg font-bold">Packaging Materials</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-3 text-left font-semibold text-blue-800">Sl</th>
              <th className="p-3 text-left font-semibold text-blue-800">Name</th>
              <th className="p-3 text-center font-semibold text-blue-800">Unit</th>
              <th className="p-3 text-center font-semibold text-blue-800">Opening</th>
              <th className="p-3 text-center font-semibold text-blue-800">Received</th>
              <th className="p-3 text-center font-semibold text-blue-800">Consumption</th>
              <th className="p-3 text-center font-semibold text-blue-800">Closing</th>
              <th className="p-3 text-center font-semibold text-blue-800">Carton Consumption</th>
              <th className="p-3 text-center font-semibold text-blue-800">Difference</th>
              <th className="p-3 text-center font-semibold text-blue-800">Process Loss</th>
            </tr>
          </thead>
          <tbody>
            {materials && materials.length > 0 ? (
              materials.map((pm, i) => (
                <tr key={pm.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{i + 1}</td>
                  <td className="p-3 text-gray-800 font-medium">{pm?.name}</td>
                  <td className="p-3 text-center text-gray-600">{pm?.unit}</td>
                  <td className="p-3 text-center text-gray-600">{pm?.opening}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(pm?.recieved)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(pm?.consumption)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(pm?.closing)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(pm?.actual_pm_carton_consumption)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(pm?.pm_carton_diff)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(pm?.loss_percent)}%</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  No materials available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}