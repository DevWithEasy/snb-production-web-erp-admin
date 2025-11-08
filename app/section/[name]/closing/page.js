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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm md:text-base">Loading materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 text-base md:text-lg mb-4 break-words">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base w-full md:w-auto"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  const sectionName = section?.charAt(0).toUpperCase() + section?.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
            {sectionName} Closing Stock
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Update closing stock values for raw and packaging materials
          </p>
        </div>

        {/* Save Button - Desktop */}
        {!isEqual(materials, closingMaterials) && (
          <div className="hidden md:flex justify-between items-center mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-700 text-sm md:text-base">You have unsaved changes</p>
            <button
              onClick={handleChangeSave}
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
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

        <div className="space-y-4 md:space-y-6">
          {/* Raw Materials Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 md:p-4 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Raw Materials ({closingMaterials.rm?.length || 0})
              </h2>
            </div>
            <div className="p-3 md:p-4">
              {closingMaterials.rm && closingMaterials.rm.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {closingMaterials.rm.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 wrap-break-word">
                          {item.name.toString()}
                        </label>
                      </div>
                      <div className="shrink-0 w-28 md:w-40 lg:w-48">
                        <input
                          type="number"
                          value={item.closing.toString()}
                          onChange={(e) =>
                            handleDateChange(e.target.value, item, "rm")
                          }
                          className="w-full px-3 py-2 md:py-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right text-sm md:text-base"
                          placeholder="Enter value"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-gray-500 text-sm md:text-base">
                  No raw materials available
                </div>
              )}
            </div>
          </div>

          {/* Packaging Materials Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 md:p-4 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Packaging Materials ({closingMaterials.pm?.length || 0})
              </h2>
            </div>
            <div className="p-3 md:p-4">
              {closingMaterials.pm && closingMaterials.pm.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {closingMaterials.pm.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 wrap-break-word">
                          {item.name.toString()}
                        </label>
                      </div>
                      <div className="shrink-0 w-28 md:w-40 lg:w-48">
                        <input
                          type="number"
                          value={item.closing.toString()}
                          onChange={(e) =>
                            handleDateChange(e.target.value, item, "pm")
                          }
                          className="w-full px-3 py-2 md:py-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right text-sm md:text-base"
                          placeholder="Enter value"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-gray-500 text-sm md:text-base">
                  No packaging materials available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Save Button (sticky at bottom for mobile) */}
        {!isEqual(materials, closingMaterials) && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
            <button
              onClick={handleChangeSave}
              disabled={updating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-medium"
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