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
    <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 text-center">Select Date</h2>
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
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={() => setDateModalVisible(false)}
            className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}