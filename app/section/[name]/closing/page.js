"use client";

import { useParams } from "next/navigation";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import isEqual from "lodash/isEqual";
import { useEffect, useState } from "react";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { useAuth } from "@/hooks/useAuth";
import ServerLoading from "@/components/ServerLoading";

export default function ClosingStock() {
  const { user } = useAuth();
  const params = useParams();
  const { name } = params;
  const section = name;

  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [closingMaterials, setClosingMaterials] = useState({ rm: [], pm: [] });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const periodId = getPeriodPath(user?.current_period);

  const period_rm_collection_name = `${section}_rm_period_${periodId}`;
  const period_pm_collection_name = `${section}_pm_period_${periodId}`;

  const fetchFromFirestore = async (collectionName) => {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const dataArray = [];
      snapshot.forEach((doc) => {
        dataArray.push({ id: doc.id, ...doc.data() });
      });
      return dataArray;
    } catch (err) {
      console.error(`Error fetching collection ${collectionName}:`, err);
      return [];
    }
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError(null);
      try {
        const rmData = await fetchFromFirestore(period_rm_collection_name);
        const pmData = await fetchFromFirestore(period_pm_collection_name);

        if (rmData.length === 0 && pmData.length === 0) {
          setError("No materials found for this section and period.");
        }

        const sortedRmData = rmData.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        const sortedPmData = pmData.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setMaterials({
          rm: sortedRmData,
          pm: sortedPmData,
        });
        setClosingMaterials({
          rm: sortedRmData,
          pm: sortedPmData,
        });
        console.log("Loaded RM and PM from Firestore");
      } catch (err) {
        setError("Error fetching materials: " + err.message);
        console.error(err);
      }
      setLoading(false);
    };

    if (section && user?.current_period) {
      fetchMaterials();
    }
  }, [section, user?.current_period]);

  function handleDateChange(value, item, field) {
    const updatedMaterials = closingMaterials[field].map((material) => {
      if (material.id === item.id) {
        return {
          ...material,
          closing: value,
        };
      }
      return material;
    });
    setClosingMaterials((prev) => ({ ...prev, [field]: updatedMaterials }));
  }

  async function handleChangeSave() {
    setUpdating(true);
    try {
      await Promise.all([
        Promise.all(
          closingMaterials.rm.map((item) => {
            const rmDocRef = doc(db, period_rm_collection_name, item.id);
            return updateDoc(rmDocRef, {
              closing: item.closing !== "" ? item.closing : 0,
            });
          })
        ),
        Promise.all(
          closingMaterials.pm.map((item) => {
            const pmDocRef = doc(db, period_pm_collection_name, item.id);
            return updateDoc(pmDocRef, {
              closing: item.closing !== "" ? item.closing : 0,
            });
          })
        ),
      ]);

      setMaterials(closingMaterials);
      console.log("Changes updated to Firestore.");
    } catch (error) {
      console.log("Error updating documents:", error);
    }
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm md:text-base">Loading materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
        <div className="text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 text-base md:text-lg mb-4 break-words">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm md:text-base w-full md:w-auto"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  const sectionName = section?.charAt(0).toUpperCase() + section?.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0 transition-colors duration-300">
      <div className="container mx-auto md:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">
            {sectionName} Closing Stock
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
            Update closing stock values for raw and packaging materials
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs md:text-sm mt-1">
            Current Period: {user?.current_period}
          </p>
        </div>

        {/* Save Button - Desktop */}
        {!isEqual(materials, closingMaterials) && (
          <div className="hidden md:flex justify-between items-center mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-blue-700 dark:text-blue-300 text-sm md:text-base">You have unsaved changes</p>
            </div>
            <button
              onClick={handleChangeSave}
              disabled={updating}
              className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
            >
              {updating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : null}
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {updating && (
          <ServerLoading visible={updating} message="Closing Value Updating." />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Raw Materials Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                Raw Materials
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {closingMaterials.rm?.length || 0} items
                </span>
              </h2>
            </div>
            <div className="p-4 md:p-6 max-h-96 overflow-y-auto">
              {closingMaterials.rm && closingMaterials.rm.length > 0 ? (
                <div className="space-y-3">
                  {closingMaterials.rm.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 wrap-break-word">
                          {item.name.toString()}
                        </label>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-48">
                        <input
                          type="number"
                          value={item.closing.toString()}
                          onChange={(e) =>
                            handleDateChange(e.target.value, item, "rm")
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 text-right text-sm md:text-base text-gray-900 dark:text-white transition-colors duration-200"
                          placeholder="Enter value"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-center hidden sm:block">
                          kg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                    No raw materials available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Packaging Materials Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                Packaging Materials
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {closingMaterials.pm?.length || 0} items
                </span>
              </h2>
            </div>
            <div className="p-4 md:p-6 max-h-96 overflow-y-auto">
              {closingMaterials.pm && closingMaterials.pm.length > 0 ? (
                <div className="space-y-3">
                  {closingMaterials.pm.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 wrap-break-word">
                          {item.name.toString()}
                        </label>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-48">
                        <input
                          type="number"
                          value={item.closing.toString()}
                          onChange={(e) =>
                            handleDateChange(e.target.value, item, "pm")
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 text-right text-sm md:text-base text-gray-900 dark:text-white transition-colors duration-200"
                          placeholder="Enter value"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-center hidden sm:block">
                          pcs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                    No packaging materials available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="lg:hidden mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {closingMaterials.rm?.length || 0}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Raw Materials
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {closingMaterials.pm?.length || 0}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              Packaging Materials
            </div>
          </div>
        </div>

        {/* Mobile Save Button (sticky at bottom for mobile) */}
        {!isEqual(materials, closingMaterials) && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg safe-area-bottom transition-colors duration-300">
            <button
              onClick={handleChangeSave}
              disabled={updating}
              className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-medium"
            >
              {updating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : null}
              {updating ? "Saving Changes..." : "Save All Changes"}
            </button>
          </div>
        )}

        {/* Extra spacing for mobile when save button is visible */}
        {!isEqual(materials, closingMaterials) && (
          <div className="md:hidden h-16"></div>
        )}
      </div>
    </div>
  );
}