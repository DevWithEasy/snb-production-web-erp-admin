'use client';

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { collection, getDocs } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Products() {
  const params = useParams();
  const section = params.name;
  const router = useRouter();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const periodId = getPeriodPath(user?.current_period);

  // Collection names
  const period_products_collection_name = `${section}_products_period_${periodId}`;
  const period_rm_collection_name = `${section}_rm_period_${periodId}`;
  const period_pm_collection_name = `${section}_pm_period_${periodId}`;

  // Fetch collection data from Firestore
  const fetchFromFirestore = async (collectionName) => {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const dataArray = [];
      snapshot.forEach((doc) => dataArray.push({ id: doc.id, ...doc.data() }));
      return dataArray;
    } catch (err) {
      console.error(`Error fetching collection ${collectionName}:`, err);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all data from Firestore in parallel
        const [productsData, rmData, pmData] = await Promise.all([
          fetchFromFirestore(period_products_collection_name),
          fetchFromFirestore(period_rm_collection_name),
          fetchFromFirestore(period_pm_collection_name)
        ]);

        setProducts(productsData);
        setMaterials({ rm: rmData, pm: pmData });

        if (productsData.length === 0) {
          setError("No recipes found for this section and period.");
        }

        if (rmData.length === 0 && pmData.length === 0) {
          console.log("No materials found for this section and period.");
        }

        console.log("Loaded all data from Firestore successfully");
      } catch (err) {
        setError("Error fetching data: " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (section && user?.current_period) {
      fetchData();
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

  const sectionName = section.charAt(0).toUpperCase() + section.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 wrap-break-word">
            {sectionName} Recipes
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Found {products.length} Product Recipe{products.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Products List */}
        {products && products.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => router.push(`/section/${section}/recipes/${product.id}`)}
                    className="w-full text-left p-4 md:p-5 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex justify-between items-center cursor-pointer active:scale-[0.98] active:bg-gray-50"
                  >
                    <span className="text-gray-700 text-sm md:text-base wrap-break-word flex-1 pr-3">
                      {product.name?.toString() || product.title?.toString() || "Unnamed Product"}
                    </span>
                    <svg 
                      className="w-4 h-4 md:w-5 md:h-5 text-gray-400 shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 md:py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="max-w-md mx-auto px-4">
              <svg 
                className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-base md:text-lg mb-4">No recipes data available</p>
              <p className="text-gray-400 text-sm md:text-base">
                There are no recipes found for the current period.
              </p>
            </div>
          </div>
        )}

        {/* Mobile Bottom Padding for Safe Area */}
        <div className="h-4 md:h-0"></div>
      </div>
    </div>
  );
}