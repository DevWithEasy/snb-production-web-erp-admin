import formatNumber from "../../utils/formatNumber";

export default function RawMateView({ materials }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 overflow-hidden transition-colors duration-300">
      <div className="bg-blue-500 dark:bg-blue-600 text-white p-2">
        <h3 className="text-base font-bold">Raw Materials</h3>
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
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Batch Consumption</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Difference</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Carton Consumption</th>
              <th className="p-3 text-center font-semibold text-blue-800 dark:text-blue-300 text-sm">Difference</th>
            </tr>
          </thead>
          <tbody>
            {materials && materials.length > 0 ? (
              materials.map((rm, i) => (
                <tr key={rm.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">{i + 1}</td>
                  <td className="p-3 text-gray-800 dark:text-gray-200 font-medium text-sm">{rm?.name}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{rm?.unit}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{rm?.opening}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(rm?.recieved)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(rm?.consumption)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(rm?.closing)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(rm?.actual_rm_batch_consumption)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(rm?.rm_bacth_diff)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(rm?.actual_rm_carton_consumption)}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-sm">{formatNumber(rm?.rm_carton_diff)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
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