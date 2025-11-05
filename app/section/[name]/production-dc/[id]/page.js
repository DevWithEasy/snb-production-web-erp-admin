'use client';

import { useParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { useAuth } from "@/hooks/useAuth";
import getRMPMTotal from "@/utils/getRMPMTotal";

export default function MaterialsDetails() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const section = params.name;
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [itemData, setItemData] = useState(null);

  const periodId = getPeriodPath(user?.current_period);
  const period_products_collection_name = `${section}_products_period_${periodId}`;

  const fetchFromFirestore = async (id) => {
    setLoading(true);
    try {
      const colRef = collection(db, period_products_collection_name);
      const snapshot = await getDocs(colRef);
      const dataArray = [];
      snapshot.forEach((doc) => {
        dataArray.push({ id: doc.id, ...doc.data() });
      });
      
      const foundItem = dataArray.find((d) => d.id === id) || null;
      setItemData(foundItem);
      console.log("Loaded item data from Firestore");
    } catch (err) {
      console.error("Error fetching from Firestore in details screen", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && periodId) {
      fetchFromFirestore(id);
    }
  }, [id, periodId]);

  // Safely calculate totals only if itemData is not null
  const total_batch = getRMPMTotal(itemData?.batch || []);
  const total_carton = getRMPMTotal(itemData?.carton || []);

  // Combined unique dates from batch and carton arrays
  const allDates = [
    ...new Set([
      ...(itemData?.batch || []).map((d) => d.date),
      ...(itemData?.carton || []).map((d) => d.date),
    ]),
  ].sort((a, b) => a - b); // Sort dates in ascending order

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading material details...</p>
        </div>
      </div>
    );
  }

  if (!itemData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">No data found for this material.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {itemData.name || "Material Details"}
          </h1>
          <p className="text-gray-600 mt-2">
            Daily production data and consumption details
          </p>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Production Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-700">Total Batch</span>
              </div>
              <span className="text-xl font-bold text-blue-900">{total_batch}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-green-700">Total Carton</span>
              </div>
              <span className="text-xl font-bold text-green-900">{total_carton}</span>
            </div>
          </div>
        </div>

        {/* Daily Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daily Production Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Click on any date to update consumption
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carton
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allDates.map((date, index) => {
                  const batchDay = (itemData.batch || []).find((d) => d.date === date);
                  const cartonDay = (itemData.carton || []).find((d) => d.date === date);

                  return (
                    <tr 
                      key={date}
                      onClick={() => router.push(`/section/${section}/consumption/${date}`)}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              Day {date}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user?.current_period}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          batchDay && Number(batchDay.qty) > 0 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {batchDay ? batchDay.qty : 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cartonDay && Number(cartonDay.qty) > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cartonDay ? cartonDay.qty : 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State for Table */}
          {allDates.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Daily Data</h3>
              <p className="text-gray-500">
                No production data available for this material.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to List
          </button>
          <button
            onClick={() => router.push(`/section/${section}/consumption/1`)}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Consumption
          </button>
        </div>
      </div>
    </div>
  );
}