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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm md:text-base">Loading recipes and materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex justify-center items-center p-5">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-65px)] bg-gray-50">
      <div className="container mx-auto md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {section &&
              `${
                section.charAt(0).toUpperCase() + section.slice(1)
              } Materials`}
          </h1>
        </div>

        {/* Raw Materials Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Raw Materials
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {materials.rm && materials.rm.length > 0 ? (
              <div className="space-y-3">
                {materials.rm.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-700 flex-1">
                      {item.name.toString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No raw materials available
              </p>
            )}
          </div>
        </section>

        {/* Packaging Materials Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Packaging Materials
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {materials.pm && materials.pm.length > 0 ? (
              <div className="space-y-3">
                {materials.pm.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-700 flex-1">
                      {item.name.toString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No packaging materials available
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
