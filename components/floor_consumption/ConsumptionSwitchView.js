'use client';

export default function ConsumptionSwitchView({
  consumptionView,
  setConsumptionView,
}) {
  return (
    <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
      {/* Production Button */}
      <button
        onClick={() => setConsumptionView(false)}
        className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
          !consumptionView
            ? 'bg-blue-600 text-white shadow'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Production
      </button>

      {/* Consumption Button */}
      <button
        onClick={() => setConsumptionView(true)}
        className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
          consumptionView
            ? 'bg-blue-600 text-white shadow'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Consumption
      </button>
    </div>
  );
}