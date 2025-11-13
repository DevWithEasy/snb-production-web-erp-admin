export default function SummaryView({ summary }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 mb-6 transition-colors duration-300">
      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="text-center p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Input</p>
          <p className="text-lg md:text-xl font-bold text-blue-800 dark:text-blue-300">{summary?.total_input} Kg</p>
        </div>
        <div className="text-center p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">Output</p>
          <p className="text-lg md:text-xl font-bold text-green-800 dark:text-green-300">{summary?.total_output} Kg</p>
        </div>
        <div className="text-center p-3 md:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Process Loss</p>
          <p className="text-lg md:text-xl font-bold text-yellow-800 dark:text-yellow-300">{summary?.process_loss} Kg</p>
        </div>
        <div className="text-center p-3 md:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Process Loss %</p>
          <p className="text-lg md:text-xl font-bold text-red-800 dark:text-red-300">{summary?.loss_percent} %</p>
        </div>
      </div>
    </div>
  );
}