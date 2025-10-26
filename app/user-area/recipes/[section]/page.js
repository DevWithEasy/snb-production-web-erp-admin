'use client';

import { useParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { useAuth } from "@/hooks/useAuth";

export default function Products() {
  const params = useParams();
  const section = params.section;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recipes and materials...</p>
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

  const sectionName = section.charAt(0).toUpperCase() + section.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {sectionName} Recipes
          </h1>
          <p className="text-gray-600 mt-2">
            Found {products.length} Product Recipe{products.length !== 1 ? "s" : ""}
          </p>
        </div>

        {products && products.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="space-y-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => router.push(`/user-area/recipes/${section}/${product.id}`)}
                    className="w-full text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex justify-between items-center"
                  >
                    <span className="text-gray-700 text-lg font-medium">
                      {product.name?.toString() || product.title?.toString()}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No recipes data available</p>
          </div>
        )}
      </div>
    </div>
  );
}