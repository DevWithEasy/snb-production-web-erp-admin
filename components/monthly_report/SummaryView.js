export default function SummaryView({ summary }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Input</p>
          <p className="text-xl font-bold text-blue-800">{summary?.total_input} Kg</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-600">Output</p>
          <p className="text-xl font-bold text-green-800">{summary?.total_output} Kg</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm font-medium text-yellow-600">Process Loss</p>
          <p className="text-xl font-bold text-yellow-800">{summary?.process_loss} Kg</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-sm font-medium text-red-600">Process Loss %</p>
          <p className="text-xl font-bold text-red-800">{summary?.loss_percent} %</p>
        </div>
      </div>
    </div>
  );
}