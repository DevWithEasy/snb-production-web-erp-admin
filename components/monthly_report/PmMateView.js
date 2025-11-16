import formatNumber from "../../utils/formatNumber";

export default function PmMateView({ materials }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 overflow-hidden transition-colors duration-300">
      <div className="bg-blue-500 dark:bg-blue-600 text-white p-2">
        <h3 className="text-base font-bold">Packaging Materials</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-blue-50 dark:bg-blue-900/30">
            <tr>
              <th className="p-3 text-left font-semibold text-blue-800 dark:text-blue-300 text-sm">Sl</th>
              <th className="p-3 text-left font-semibold text-blue-800 dark:text-blue-300 text-sm">Name</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Unit</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Opening</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Received</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Consumption</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Closing</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Carton Consumption</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Difference</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">P.Loss</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">L.G Qty</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">L.G Value</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {materials && materials.length > 0 ? (
              materials.map((pm, i) => (
                <tr key={pm.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">{i + 1}</td>
                  <td className="p-3 text-gray-800 dark:text-gray-200 font-medium text-sm">{pm?.name}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{pm?.unit}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{pm?.opening}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(pm?.recieved)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(pm?.consumption)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(pm?.closing)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(pm?.actual_pm_carton_consumption)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(pm?.pm_carton_diff)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(pm?.loss_percent)}%</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(pm?.lgQty)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(pm?.lgValue)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{pm?.status ? '✘' : '✔'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
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