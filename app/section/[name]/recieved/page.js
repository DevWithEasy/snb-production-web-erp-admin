"use client";

import ServerLoading from "@/components/ServerLoading";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Recieved() {
  const { user } = useAuth();
  const params = useParams();
  const section = params.name;

  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

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
        const [rmData, pmData] = await Promise.all([
          fetchFromFirestore(period_rm_collection_name),
          fetchFromFirestore(period_pm_collection_name),
        ]);

        if (rmData.length === 0 && pmData.length === 0) {
          setError("No materials found for this section and period.");
        }

        setMaterials({
          rm: rmData.sort((a, b) => a.name.localeCompare(b.name)),
          pm: pmData.sort((a, b) => a.name.localeCompare(b.name)),
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
    const recieved_days = item.recieved_days.map((d) => {
      if (d.date.toString() === selectedDate) {
        return { ...d, qty: value };
      }
      return d;
    });

    const updatedMaterials = materials[field].map((material) => {
      if (material.id === item.id) {
        return {
          ...material,
          recieved_days,
        };
      }
      return material;
    });
    setMaterials((prev) => ({ ...prev, [field]: updatedMaterials }));
  }

  function getFieldValue(item) {
    return (
      item?.recieved_days
        ?.find((i) => i.date.toString() === selectedDate)
        ?.qty?.toString() || ""
    );
  }

  async function handleChangeSave() {
    setUpdating(true);
    try {
      await Promise.all([
        Promise.all(
          materials.rm.map((item) => {
            const rmDocRef = doc(db, period_rm_collection_name, item.id);
            return updateDoc(rmDocRef, { recieved_days: item.recieved_days });
          })
        ),
        Promise.all(
          materials.pm.map((item) => {
            const pmDocRef = doc(db, period_pm_collection_name, item.id);
            return updateDoc(pmDocRef, { recieved_days: item.recieved_days });
          })
        ),
      ]);

      setUpdating(false);
      console.log("Changes updated to Firestore successfully");
    } catch (error) {
      setUpdating(false);
      console.log("Error updating documents:", error);
      alert("Error updating documents: " + error.message);
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-6 transition-colors duration-300">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-2 wrap-break-word">
            {sectionName} Store Received
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Manage daily received quantities for materials
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs md:text-sm mt-1">
            Current Period: {user?.current_period}
          </p>
        </div>

        {/* Date Selection Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6 md:mb-8 transition-colors duration-300">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-12 border border-gray-300 dark:border-gray-600 rounded-lg px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm md:text-base transition-colors duration-200"
              >
                <option value="">Choose a date...</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day.toString()}>
                    {`${day.toString()} ${user?.current_period}`}
                  </option>
                ))}
              </select>
            </div>

            {selectedDate !== "" && (
              <div className="w-full lg:w-auto">
                <button
                  onClick={handleChangeSave}
                  disabled={updating}
                  className="w-full lg:w-auto bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 md:px-8 py-3 rounded-lg transition-colors disabled:opacity-50 font-medium text-sm md:text-base"
                >
                  {updating ? (
                    <span className="flex items-center gap-2 justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </span>
                  ) : (
                    "Save All Changes"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {updating && (
          <ServerLoading
            visible={updating}
            message="Received Quantity Updating"
          />
        )}

        {/* Materials Cards */}
        {selectedDate !== "" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {/* Raw Materials Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              <div className="bg-blue-500 dark:bg-blue-600 text-white p-4">
                <h2 className="text-lg md:text-xl font-bold">Raw Materials</h2>
                <p className="text-blue-100 dark:text-blue-200 text-xs md:text-sm">
                  {materials.rm.length} items
                </p>
              </div>
              <div className="p-3 md:p-4 max-h-96 overflow-y-auto">
                {materials.rm && materials.rm.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
                    {materials.rm.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <span className="text-gray-700 dark:text-gray-300 font-medium flex-1 text-sm md:text-base wrap-break-word pr-2">
                          {item.name.toString()}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            step="0.01"
                            value={getFieldValue(item)}
                            onChange={(e) =>
                              handleDateChange(e.target.value, item, "rm")
                            }
                            className="w-20 md:w-24 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-2 md:px-3 py-1 md:py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm md:text-base text-gray-900 dark:text-white transition-colors duration-200"
                            placeholder="0.00"
                            min="0"
                          />
                          <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm w-6 md:w-8">kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-8">
                    <div className="text-gray-400 dark:text-gray-500 text-4xl md:text-6xl mb-2">📦</div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">No raw materials available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Packaging Materials Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              <div className="bg-green-500 dark:bg-green-600 text-white p-4">
                <h2 className="text-lg md:text-xl font-bold">Packaging Materials</h2>
                <p className="text-green-100 dark:text-green-200 text-xs md:text-sm">
                  {materials.pm.length} items
                </p>
              </div>
              <div className="p-3 md:p-4 max-h-96 overflow-y-auto">
                {materials.pm && materials.pm.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
                    {materials.pm.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <span className="text-gray-700 dark:text-gray-300 font-medium flex-1 text-sm md:text-base wrap-break-word pr-2">
                          {item.name.toString()}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            step="0.01"
                            value={getFieldValue(item)}
                            onChange={(e) =>
                              handleDateChange(e.target.value, item, "pm")
                            }
                            className="w-20 md:w-24 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-2 md:px-3 py-1 md:py-2 text-right focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-sm md:text-base text-gray-900 dark:text-white transition-colors duration-200"
                            placeholder="0.00"
                            min="0"
                          />
                          <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm w-6 md:w-8">pcs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-8">
                    <div className="text-gray-400 dark:text-gray-500 text-4xl md:text-6xl mb-2">📦</div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                      No packaging materials available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedDate === "" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 lg:p-12 text-center transition-colors duration-300">
            <div className="text-gray-400 dark:text-gray-500 text-3xl md:text-5xl mb-4 md:mb-6">📅</div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
              Select a Date
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base lg:text-lg max-w-md mx-auto">
              Choose a date from the dropdown above to start managing received
              quantities for materials
            </p>
          </div>
        )}

        {/* Mobile Stats */}
        {selectedDate !== "" && (
          <div className="lg:hidden mt-6 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {materials.rm?.length || 0}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Raw Materials
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {materials.pm?.length || 0}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                Packaging Materials
              </div>
            </div>
          </div>
        )}

        {/* Mobile Save Button (sticky at bottom for mobile) */}
        {selectedDate !== "" && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg safe-area-bottom transition-colors duration-300">
            <button
              onClick={handleChangeSave}
              disabled={updating}
              className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50 font-medium text-base"
            >
              {updating ? (
                <span className="flex items-center gap-2 justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving Changes...
                </span>
              ) : (
                "Save All Changes"
              )}
            </button>
          </div>
        )}

        {/* Extra spacing for mobile when save button is visible */}
        {selectedDate !== "" && (
          <div className="lg:hidden h-16"></div>
        )}
      </div>
    </div>
  );
}