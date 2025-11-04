import formatNumber from "../../utils/formatNumber";

export default function RawMateView({ materials }) {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="bg-blue-500 text-white p-4">
        <h3 className="text-lg font-bold">Raw Materials</h3>
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
              <th className="p-3 text-center font-semibold text-blue-800">Batch Consumption</th>
              <th className="p-3 text-center font-semibold text-blue-800">Difference</th>
              <th className="p-3 text-center font-semibold text-blue-800">Carton Consumption</th>
              <th className="p-3 text-center font-semibold text-blue-800">Difference</th>
            </tr>
          </thead>
          <tbody>
            {materials && materials.length > 0 ? (
              materials.map((rm, i) => (
                <tr key={rm.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{i + 1}</td>
                  <td className="p-3 text-gray-800 font-medium">{rm?.name}</td>
                  <td className="p-3 text-center text-gray-600">{rm?.unit}</td>
                  <td className="p-3 text-center text-gray-600">{rm?.opening}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(rm?.recieved)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(rm?.consumption)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(rm?.closing)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(rm?.actual_rm_batch_consumption)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(rm?.rm_bacth_diff)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(rm?.actual_rm_carton_consumption)}</td>
                  <td className="p-3 text-center text-gray-600">{formatNumber(rm?.rm_carton_diff)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500">
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