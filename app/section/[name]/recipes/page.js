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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const periodId = getPeriodPath(user?.current_period);
  const collectionName = `${section}_products_period_${periodId}`;

  // Simplified data fetching
  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const productsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      return productsData;
    } catch (err) {
      console.error("Error fetching products:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (!section || !user?.current_period) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const productsData = await fetchProducts();
        
        setProducts(productsData);
        if (productsData.length === 0) {
          setError("No recipes found for this section and period.");
        }
      } catch (err) {
        setError("Error fetching data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [section, user?.current_period]);

  // Early returns for different states
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const sectionName = section?.charAt(0).toUpperCase() + section?.slice(1) || 'Products';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 md:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        <Header sectionName={sectionName} productsCount={products.length} />
        
        {products.length > 0 ? (
          <ProductsList products={products} section={section} router={router} />
        ) : (
          <EmptyState />
        )}

        <div className="h-4 md:h-0" />
      </div>
    </div>
  );
}

// Extracted components for better readability
const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading recipes and materials...</p>
    </div>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
    <div className="text-center max-w-md">
      <p className="text-red-600 dark:text-red-400 mb-4 break-words">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors w-full md:w-auto"
      >
        Reload
      </button>
    </div>
  </div>
);

const Header = ({ sectionName, productsCount }) => (
  <div className="mb-6 md:mb-8">
    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
      {sectionName} Recipes
    </h1>
    <p className="text-gray-600 dark:text-gray-400 mt-2">
      Found {productsCount} Product Recipe{productsCount !== 1 ? "s" : ""}
    </p>
  </div>
);

const ProductsList = ({ products, section, router }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
    <div className="p-4 md:p-6">
      <div className="space-y-3 md:space-y-4">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => router.push(`/section/${section}/recipes/${product.id}`)}
            className="w-full text-left p-4 md:p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-blue-900/20 transition-all duration-200 flex justify-between items-center cursor-pointer active:scale-[0.98]"
          >
            <span className="text-gray-700 dark:text-gray-300 flex-1 pr-3 text-xs md:text-sm">
              {product.name || product.title || "Unnamed Product"}
            </span>
            <ChevronRightIcon />
          </button>
        ))}
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-8 md:py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
    <div className="max-w-md mx-auto px-4">
      <DocumentIcon />
      <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No recipes data available</p>
      <p className="text-gray-400 dark:text-gray-500">
        There are no recipes found for the current period.
      </p>
    </div>
  </div>
);

// Reusable icons
const ChevronRightIcon = () => (
  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-16 h-16 md:w-20 md:h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);