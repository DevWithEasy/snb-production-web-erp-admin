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
      <div className="flex-1 flex justify-center items-center p-5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading materials...</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {section && `${section.charAt(0).toUpperCase() + section.slice(1)} Opening Stock`}
          </h1>
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex-1 max-w-xs"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Raw Materials Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Raw Materials</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {openingMaterials.rm && openingMaterials.rm.length > 0 ? (
                <div className="space-y-4">
                  {openingMaterials.rm.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-700 flex-1 font-medium">{item.name.toString()}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.opening.toString()}
                        onChange={(e) => handleDateChange(e.target.value, item, "rm")}
                        className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No raw materials available</p>
              )}
            </div>
          </section>

          {/* Packaging Materials Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Packaging Materials</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {openingMaterials.pm && openingMaterials.pm.length > 0 ? (
                <div className="space-y-4">
                  {openingMaterials.pm.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-700 flex-1 font-medium">{item.name.toString()}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.opening.toString()}
                        onChange={(e) => handleDateChange(e.target.value, item, "pm")}
                        className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No packaging materials available</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}