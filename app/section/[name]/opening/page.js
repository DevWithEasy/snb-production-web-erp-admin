'use client';

import { useParams } from 'next/navigation';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import isEqual from 'lodash/isEqual';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/utils/firebaseConfig';
import getPeriodPath from '@/utils/getPeriodPath';
import ServerLoading from '@/components/ServerLoading';

export default function Recieved() {
  const { user } = useAuth();
  const params = useParams();
  const  section  = params.name;

  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [openingMaterials, setOpeningMaterials] = useState({ rm: [], pm: [] });
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
        const [rmData, pmData] = await Promise.all([
          fetchFromFirestore(period_rm_collection_name),
          fetchFromFirestore(period_pm_collection_name),
        ]);

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
        setOpeningMaterials({
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
    const updatedMaterials = openingMaterials[field].map((material) => {
      if (material.id === item.id) {
        return {
          ...material,
          opening: value,
        };
      }
      return material;
    });
    setOpeningMaterials((prev) => ({ ...prev, [field]: updatedMaterials }));
  }

  async function handleChangeSave() {
    setUpdating(true);
    try {
      await Promise.all([
        Promise.all(
          openingMaterials.rm.map((item) => {
            const rmDocRef = doc(db, period_rm_collection_name, item.id);
            return updateDoc(rmDocRef, {
              opening: item.opening !== "" ? item.opening : 0,
            });
          })
        ),
        Promise.all(
          openingMaterials.pm.map((item) => {
            const pmDocRef = doc(db, period_pm_collection_name, item.id);
            return updateDoc(pmDocRef, {
              opening: item.opening !== "" ? item.opening : 0,
            });
          })
        ),
      ]);

      setMaterials(openingMaterials);
      console.log("Changes updated to Firestore successfully");
    } catch (error) {
      console.log("Error updating documents:", error);
      alert("Error updating documents: " + error.message);
    }
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-5 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-5 transition-colors duration-300">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 text-center break-words">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto md:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            {section && `${section.charAt(0).toUpperCase() + section.slice(1)} Opening Stock`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
            Current Period: {user?.current_period}
          </p>
        </div>

        {/* Save Button - Only show when there are changes */}
        {!isEqual(materials, openingMaterials) && (
          <div className="flex justify-between items-center gap-3 mb-6">
            {updating && (
              <ServerLoading visible={updating} message='Opening Value Updating.' />
            )}
            <button
              onClick={handleChangeSave}
              disabled={updating}
              className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex-1 max-w-xs font-medium"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Raw Materials Section */}
          <section className="w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  Raw Materials
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {openingMaterials.rm?.length || 0} items
                  </span>
                </h2>
              </div>
              <div className="p-4 md:p-6 max-h-96 overflow-y-auto">
                {openingMaterials.rm && openingMaterials.rm.length > 0 ? (
                  <div className="space-y-3">
                    {openingMaterials.rm.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <span className="text-gray-700 dark:text-gray-300 flex-1 font-medium text-xs md:text-sm">
                          {item.name.toString()}
                        </span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            step="0.01"
                            value={item.opening.toString()}
                            onChange={(e) => handleDateChange(e.target.value, item, "rm")}
                            className="w-full sm:w-32 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            placeholder="0.00"
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
          </section>

          {/* Packaging Materials Section */}
          <section className="w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  Packaging Materials
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {openingMaterials.pm?.length || 0} items
                  </span>
                </h2>
              </div>
              <div className="p-4 md:p-6 max-h-96 overflow-y-auto">
                {openingMaterials.pm && openingMaterials.pm.length > 0 ? (
                  <div className="space-y-3">
                    {openingMaterials.pm.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <span className="text-gray-700 dark:text-gray-300 flex-1 font-medium text-xs md:text-sm">
                          {item.name.toString()}
                        </span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            step="0.01"
                            value={item.opening.toString()}
                            onChange={(e) => handleDateChange(e.target.value, item, "pm")}
                            className="w-full sm:w-32 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            placeholder="0.00"
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
          </section>
        </div>

        {/* Mobile Stats */}
        <div className="lg:hidden mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {openingMaterials.rm?.length || 0}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Raw Materials
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {openingMaterials.pm?.length || 0}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              Packaging Materials
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}