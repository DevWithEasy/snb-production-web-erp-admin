'use client';

import { useParams } from "next/navigation";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { useAuth } from "@/hooks/useAuth";
import formatNumber from "@/utils/formatNumber";

export default function ConsumptionUpdate() {
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
    const consumption_days = item.consumption_days.map((d) => {
      if (d.date.toString() === selectedDate) {
        return { ...d, qty: value };
      }
      return d;
    });

    const updatedMaterials = materials[field].map((material) => {
      if (material.id === item.id) {
        return {
          ...material,
          consumption_days,
        };
      }
      return material;
    });
    setMaterials((prev) => ({ ...prev, [field]: updatedMaterials }));
  }

  function getFieldValue(item) {
    return (
      item?.consumption_days
        ?.find((i) => i.date.toString() === selectedDate)
        ?.qty?.toString() || "0"
    );
  }

  async function handleChangeSave() {
    setUpdating(true);
    try {
      await Promise.all([
        Promise.all(
          materials.rm.map((item) => {
            const rmDocRef = doc(db, period_rm_collection_name, item.id);
            return updateDoc(rmDocRef, { consumption_days: item.consumption_days });
          })
        ),
        Promise.all(
          materials.pm.map((item) => {
            const pmDocRef = doc(db, period_pm_collection_name, item.id);
            return updateDoc(pmDocRef, { consumption_days: item.consumption_days });
          })
        ),
      ]);

      setUpdating(false);
      console.log("Changes updated to Firestore successfully");
    } catch (error) {
      setUpdating(false);
      console.log("Error updating documents:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  const sectionName = section?.charAt(0).toUpperCase() + section?.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {sectionName} Consumption Update
          </h1>
          <p className="text-gray-600 mt-2">
            Update daily consumption values for materials
          </p>
        </div>

        {/* Date Picker and Save Button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select a Date</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option
                  key={day}
                  value={day.toString()}
                >
                  {day.toString()} {user?.current_period}
                </option>
              ))}
            </select>
          </div>

          {selectedDate !== "" && (
            <div className="w-full sm:w-auto">
              <button
                onClick={handleChangeSave}
                disabled={updating}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : null}
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {updating && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 text-sm">Updating changes...</span>
          </div>
        )}

        {/* Materials Sections */}
        {selectedDate !== "" && (
          <div className="space-y-6">
            {/* Raw Materials Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Raw Materials</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update consumption for {selectedDate} {user?.current_period}
                </p>
              </div>
              <div className="p-4">
                {materials.rm && materials.rm.length > 0 ? (
                  <div className="space-y-4">
                    {materials.rm.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {item.name.toString()}
                          </label>
                          <p className="text-xs text-gray-500">
                            Current: {getFieldValue(item)}
                          </p>
                        </div>
                        <div className="w-full sm:w-48">
                          <input
                            type="number"
                            value={getFieldValue(item)}
                            onChange={(e) => handleDateChange(e.target.value, item, "rm")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                            placeholder="Enter consumption"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No raw materials available
                  </div>
                )}
              </div>
            </div>

            {/* Packaging Materials Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Packaging Materials</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update consumption for {selectedDate} {user?.current_period}
                </p>
              </div>
              <div className="p-4">
                {materials.pm && materials.pm.length > 0 ? (
                  <div className="space-y-4">
                    {materials.pm.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {item.name.toString()}
                          </label>
                          <p className="text-xs text-gray-500">
                            Current: {getFieldValue(item)}
                          </p>
                        </div>
                        <div className="w-full sm:w-48">
                          <input
                            type="number"
                            value={getFieldValue(item)}
                            onChange={(e) => handleDateChange(e.target.value, item, "pm")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                            placeholder="Enter consumption"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No packaging materials available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State when no date selected */}
        {selectedDate === "" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Date</h3>
              <p className="text-gray-500">
                Please select a date from the dropdown above to view and update consumption values.
              </p>
            </div>
          </div>
        )}

        {/* Mobile Save Button (sticky at bottom for mobile) */}
        {selectedDate !== "" && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
            <button
              onClick={handleChangeSave}
              disabled={updating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : null}
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}