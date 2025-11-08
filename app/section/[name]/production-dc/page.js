'use client';

import { useParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { useAuth } from "@/hooks/useAuth";
import DCFilterModal from "@/components/production_dc/DCFilterModal";

export default function ProductionDC() {
  const { user } = useAuth();
  const params = useParams();
  const section = params.name;
  const router = useRouter();

  const [recipes, setRecipes] = useState(null);
  const [filteredRecipes, setFilteredRecipes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date filter modal state
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [startDate, setStartDate] = useState("1");
  const [endDate, setEndDate] = useState("31");

  // Construct Firestore collection
  const periodId = getPeriodPath(user?.current_period);
  const period_products_collection_name = `${section}_products_period_${periodId}`;

  const fetchFromFirestore = async () => {
    try {
      const colRef = collection(db, period_products_collection_name);
      const snapshot = await getDocs(colRef);
      const dataArray = [];
      snapshot.forEach((doc) => {
        dataArray.push({ id: doc.id, ...doc.data() });
      });
      return dataArray.sort((a,b)=>a.name.localeCompare(b.name));
    } catch (err) {
      console.error(`Error fetching recipe collection:`, err);
      return [];
    }
  };

  const filterByDateRange = (days, start, end) => {
    return (
      days
        ?.filter(
          (day) => day.date >= parseInt(start) && day.date <= parseInt(end)
        )
        ?.reduce((acc, day) => acc + Number(day.qty || 0), 0) || 0
    );
  };

  const processRecipesData = (recipesData, start = 1, end = 31) => {
    if (!recipesData) return [];
    return recipesData.map((recipe) => {
      const total_batch = filterByDateRange(recipe.batch, start, end);
      const total_carton = filterByDateRange(recipe.carton, start, end);
      return { ...recipe, total_batch, total_carton };
    });
  };

  const totalBatchCarton = (recipesData) => {
    let batch = 0;
    let carton = 0;
    recipesData.forEach((recipe) => {
      batch += Number(recipe.total_batch || 0);
      carton += Number(recipe.total_carton || 0);
    });
    return { batch, carton };
  };

  const applyDateFilter = () => {
    const start = Math.max(1, parseInt(startDate) || 1);
    const end = Math.min(31, parseInt(endDate) || 31);

    setStartDate(start.toString());
    setEndDate(end.toString());

    const processedData = processRecipesData(recipes, start, end);
    setFilteredRecipes(processedData);
    setDateModalVisible(false);
  };

  const resetDateFilter = () => {
    setStartDate("1");
    setEndDate("31");
    setFilteredRecipes(processRecipesData(recipes, 1, 31));
    setDateModalVisible(false);
  };

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const firestoreRecipes = await fetchFromFirestore();
      if (firestoreRecipes.length > 0) {
        setRecipes(firestoreRecipes);
        setFilteredRecipes(processRecipesData(firestoreRecipes));
        console.log("Loaded recipes from Firestore");
      } else {
        setError("No recipe found for this section: " + section?.toUpperCase());
      }
    } catch (err) {
      setError("Error fetching recipes: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (section && user?.current_period) {
      fetchRecipes();
    }
  }, [section, user?.current_period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recipes...</p>
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
  const pageTitle = `${sectionName} Delivery Chalan${
    startDate !== "1" || endDate !== "31" ? ` (${startDate}-${endDate})` : ""
  }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-600 mt-2">
              View production and delivery details
            </p>
          </div>
          <button
            onClick={() => setDateModalVisible(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Filter by date range"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Date Filter Modal */}
        <DCFilterModal
          dateModalVisible={dateModalVisible}
          setDateModalVisible={setDateModalVisible}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          resetDateFilter={resetDateFilter}
          applyDateFilter={applyDateFilter}
        />

        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Total Batch:</span>
              <span className="text-lg font-bold text-blue-900">
                {filteredRecipes ? totalBatchCarton(filteredRecipes).batch : 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">Total Carton:</span>
              <span className="text-lg font-bold text-green-900">
                {filteredRecipes ? totalBatchCarton(filteredRecipes).carton : 0}
              </span>
            </div>
          </div>
        </div>

        {/* Recipes List */}
        {filteredRecipes && filteredRecipes.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Batch
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Carton
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecipes.map((item) => (
                    <tr 
                      key={item.id}
                      onClick={() => router.push(`/section/${section}/production-dc//${item.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {item.name?.toString() || item.title?.toString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.total_batch}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.total_carton}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recipes Available</h3>
            <p className="text-gray-500">
              No recipe data found for this section and period.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}