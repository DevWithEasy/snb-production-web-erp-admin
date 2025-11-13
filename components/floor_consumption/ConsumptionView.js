'use client';

import { useState } from "react";
import formatNumber from "@/utils/formatNumber";

export default function ConsumptionView({
  consumption,
  getItemTotals,
  getItemName,
  handleValueChange,
  hasExpressionError,
}) {
  const [horizontalScroll, setHorizontalScroll] = useState(0);

  if (consumption?.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center transition-colors duration-300">
        <p className="text-gray-500 dark:text-gray-400">No consumption added.</p>
      </div>
    );
  }

  const hasErrors = Object.values(consumption).some((prod, prodIdx) => 
    prod.rm.some((item, itemIdx) => hasExpressionError("rm", item.id, prodIdx)) ||
    prod.pm.some((item, itemIdx) => hasExpressionError("pm", item.id, prodIdx))
  );

  return (
    <div className="space-y-6">
      {/* Error Warning Banner */}
      {hasErrors && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded transition-colors duration-300">
          <div className="flex items-center">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                Some fields contain invalid mathematical expressions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Raw Materials Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Raw Material Consumption</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                  Item Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                  Unit
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                  Total
                </th>
                {consumption.map((p) => (
                  <th
                    key={p.id}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32"
                  >
                    <span className="line-clamp-2">{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {getItemTotals("rm").map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white w-48">
                    {getItemName("rm", item.id)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center w-20">
                    {item.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium text-center w-24">
                    {formatNumber(item.total)}
                  </td>
                  {consumption.map((prod, prodIdx) => {
                    const prodItem = prod.rm.find((it) => it.id === item.id);
                    const inputVal = prodItem ? prodItem.qty : "0";
                    const hasError = hasExpressionError("rm", item.id, prodIdx);
                    
                    return (
                      <td key={`${prod.id}-${item.id}`} className="px-4 py-3 w-32">
                        <input
                          type="text"
                          value={inputVal}
                          onChange={(e) =>
                            handleValueChange("rm", item.id, prodIdx, e.target.value)
                          }
                          className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-right transition-colors duration-200 ${
                            hasError 
                              ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200' 
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                          placeholder="0"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packaging Materials Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Packaging Material Consumption</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                  Item Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                  Unit
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                  Total
                </th>
                {consumption.map((p) => (
                  <th
                    key={p.id}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32"
                  >
                    <span className="line-clamp-2">{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {getItemTotals("pm").map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white w-48">
                    {getItemName("pm", item.id)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center w-20">
                    {item.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium text-center w-24">
                    {formatNumber(item.total)}
                  </td>
                  {consumption.map((prod, prodIdx) => {
                    const prodItem = prod.pm.find((it) => it.id === item.id);
                    const inputVal = prodItem ? prodItem.qty : "0";
                    const hasError = hasExpressionError("pm", item.id, prodIdx);
                    
                    return (
                      <td key={`${prod.id}-${item.id}`} className="px-4 py-3 w-32">
                        <input
                          type="text"
                          value={inputVal}
                          onChange={(e) =>
                            handleValueChange("pm", item.id, prodIdx, e.target.value)
                          }
                          className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-right transition-colors duration-200 ${
                            hasError 
                              ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200' 
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                          placeholder="0"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}