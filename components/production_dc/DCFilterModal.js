'use client';

export default function DCFilterModal({
  dateModalVisible,
  setDateModalVisible,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetDateFilter,
  applyDateFilter,
}) {
  const handleStartDateChange = (text) => {
    const num = text.replace(/[^0-9]/g, "");
    if (num === "") {
      setStartDate("");
    } else {
      const val = Math.min(31, Math.max(1, parseInt(num)));
      setStartDate(val.toString());
    }
  };

  const handleEndDateChange = (text) => {
    const num = text.replace(/[^0-9]/g, "");
    if (num === "") {
      setEndDate("");
    } else {
      const val = Math.min(31, Math.max(1, parseInt(num)));
      setEndDate(val.toString());
    }
  };

  if (!dateModalVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Date Range</h3>
          <button
            onClick={() => setDateModalVisible(false)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date (1-31)
            </label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              maxLength={2}
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date (1-31)
            </label>
            <input
              type="text"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              maxLength={2}
              placeholder="31"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setDateModalVisible(false)}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={resetDateFilter}
            className="flex-1 px-4 py-2 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={applyDateFilter}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Apply
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            Showing data from day {startDate} to {endDate}
          </p>
        </div>
      </div>
    </div>
  );
}