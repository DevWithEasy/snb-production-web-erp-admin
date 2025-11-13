"use client";

import { useState } from "react";
import { FaTimes, FaRedo } from "react-icons/fa";

export default function ColumnVisibilityModal({
  settingsModalVisible,
  setSettingsModalVisible,
  columnVisibility,
  setColumnVisibility,
}) {
  const [localVisibility, setLocalVisibility] = useState(columnVisibility);

  if (!settingsModalVisible) return null;

  const toggleSwitch = (key) => {
    setLocalVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetToDefault = () => {
    setLocalVisibility({
      opening: true,
      received: true,
      consumption: true,
      stock: true,
    });
  };

  const applyChanges = () => {
    setColumnVisibility(localVisibility);
    setSettingsModalVisible(false);
  };

  const columns = [
    { key: 'opening', label: 'Opening Stock', icon: '📊' },
    { key: 'received', label: 'Received', icon: '📥' },
    { key: 'consumption', label: 'Consumption', icon: '📤' },
    { key: 'stock', label: 'Current Stock', icon: '📦' },
  ];

  return (
    <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md transition-colors duration-300">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Column Settings</h2>
          <button
            onClick={() => setSettingsModalVisible(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-600 dark:text-gray-400" size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">Choose which columns to display</p>

          {/* Column List */}
          <div className="space-y-4">
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{column.icon}</span>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">{column.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {localVisibility[column.key] ? 'Visible' : 'Hidden'}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localVisibility[column.key]}
                    onChange={() => toggleSwitch(column.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
          <button
            onClick={resetToDefault}
            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            <FaRedo size={16} />
            <span>Reset to Default</span>
          </button>
          <button
            onClick={applyChanges}
            className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}