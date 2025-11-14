"use client";

import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";

export default function SectionMaterials() {
  const { user } = useAuth();
  const params = useParams();
  const section = params.name;

  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const periodId = getPeriodPath(user?.current_period);

  const period_rm_collection_name = `${section}_rm_period_${periodId}`;
  const period_pm_collection_name = `${section}_pm_period_${periodId}`;

  // Firestore থেকে ডেটা সংগ্রহের ফাংশন
  const fetchFromFirestore = async (collectionName) => {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      let dataArray = [];
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
    const fetchSectionMaterials = async () => {
      setLoading(true);
      setError(null);

      try {
        // Firestore থেকে ডেটা আনা
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

        console.log("Loaded materials from Firestore successfully");
      } catch (err) {
        setError("Error fetching materials: " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (section && user?.current_period) {
      fetchSectionMaterials();
    }
  }, [section, user?.current_period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Loading recipes and materials...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex justify-center items-center p-5 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto md:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
            {section &&
              `${
                section.charAt(0).toUpperCase() + section.slice(1)
              } Materials`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mt-2">
            Current Period: {user?.current_period}
          </p>
        </div>

        {/* Grid Layout for larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Raw Materials Section */}
          <section className="w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  Raw Materials
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {materials.rm?.length || 0} items
                  </span>
                </h2>
              </div>
              <div className="p-4 md:p-6 max-h-96 overflow-y-auto">
                {materials.rm && materials.rm.length > 0 ? (
                  <div className="space-y-3">
                    {materials.rm.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center py-2 px-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono w-6">
                          {index + 1}.
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1 text-xs md:text-sm">
                          {item.name.toString()}
                        </span>
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
                    {materials.pm?.length || 0} items
                  </span>
                </h2>
              </div>
              <div className="p-4 md:p-6 max-h-96 overflow-y-auto">
                {materials.pm && materials.pm.length > 0 ? (
                  <div className="space-y-3">
                    {materials.pm.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center py-2 px-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono w-6">
                          {index + 1}.
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1 text-xs md:text-sm">
                          {item.name.toString()}
                        </span>
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

        {/* Mobile Layout Stats */}
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
      </div>
    </div>
  );
}