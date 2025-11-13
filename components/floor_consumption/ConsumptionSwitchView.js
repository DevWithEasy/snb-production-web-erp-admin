'use client';

export default function ConsumptionSwitchView({
  consumptionView,
  setConsumptionView,
}) {
  return (
    <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1 mb-6 transition-colors duration-300">
      {/* Production Button */}
      <button
        onClick={() => setConsumptionView(false)}
        className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
          !consumptionView
            ? 'bg-blue-600 dark:bg-blue-700 text-white shadow'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Production
      </button>

      {/* Consumption Button */}
      <button
        onClick={() => setConsumptionView(true)}
        className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
          consumptionView
            ? 'bg-blue-600 dark:bg-blue-700 text-white shadow'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Consumption
      </button>
    </div>
  );
}