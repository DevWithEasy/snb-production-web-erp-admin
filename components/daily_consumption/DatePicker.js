"use client";

export default function DatePicker({
  dateModalVisible,
  setDateModalVisible,
  date,
  setDate,
  applyDateFilter,
}) {
  if (!dateModalVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl transition-colors duration-300">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white text-center">Select Date</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => {
                  setDateModalVisible(false);
                  applyDateFilter(day);
                  setDate(day);
                }}
                className={`p-3 rounded-lg font-medium transition-colors ${
                  Number(date) === day
                    ? "bg-blue-600 dark:bg-blue-700 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
          <button
            onClick={() => setDateModalVisible(false)}
            className="w-full py-2 px-4 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}