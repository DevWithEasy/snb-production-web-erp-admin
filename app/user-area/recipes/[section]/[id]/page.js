"use client";

import { useParams } from "next/navigation";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import getInfoUnit from "@/utils/getInfoUnit";
import { useAuth } from "@/hooks/useAuth";
import RecipeActions from "@/components/recipe/RecipeActions";
import Image from "next/image";

export default function RecipeDetails() {
  const params = useParams();
  const section = params.section;
  const productId = params.id;
  const { user } = useAuth();

  const [recipeData, setRecipeData] = useState(null);
  const [materialsData, setMaterialsData] = useState({ rm: [], pm: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch specific product and materials
  const fetchRecipeData = async () => {
    setLoading(true);
    setError(null);

    try {
      const periodId = getPeriodPath(user?.current_period);

      // Collection names
      const period_products_collection_name = `${section}_products_period_${periodId}`;
      const period_rm_collection_name = `${section}_rm_period_${periodId}`;
      const period_pm_collection_name = `${section}_pm_period_${periodId}`;

      // Fetch product data
      const productDocRef = doc(db, period_products_collection_name, productId);
      const productSnapshot = await getDoc(productDocRef);

      if (!productSnapshot.exists()) {
        throw new Error("Product not found");
      }

      const productData = { id: productSnapshot.id, ...productSnapshot.data() };
      setRecipeData(productData);

      // Fetch materials data
      const [rmData, pmData] = await Promise.all([
        getDocs(collection(db, period_rm_collection_name)),
        getDocs(collection(db, period_pm_collection_name)),
      ]);

      const rmArray = [];
      const pmArray = [];

      rmData.forEach((doc) => rmArray.push({ id: doc.id, ...doc.data() }));
      pmData.forEach((doc) => pmArray.push({ id: doc.id, ...doc.data() }));

      setMaterialsData({ rm: rmArray, pm: pmArray });
    } catch (err) {
      setError("Error fetching recipe data: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (section && productId && user?.current_period) {
      fetchRecipeData();
    }
  }, [section, productId, user?.current_period]);

  const findMaterialName = (id, list) => {
    const found = list.find((mat) => mat.id === id);
    return found ? found.name || found.id : id;
  };

  const renderMaterialTable = (batchList, cartonList, localMaterials) => {
    return batchList.map((batchItem, idx) => {
      const name = findMaterialName(batchItem.id, localMaterials);
      const cartonItem = cartonList.find((c) => c.id === batchItem.id);
      const isLast = idx === batchList.length - 1;

      return (
        <div
          key={batchItem.id}
          className={`flex border-b ${
            isLast ? "border-b-0" : "border-gray-200"
          } py-3 px-4`}
        >
          <div className="flex-1 text-gray-700">{name}</div>
          <div className="w-20 text-center text-gray-600">
            {batchItem.unit || "-"}
          </div>
          <div className="w-24 text-right text-gray-700">{batchItem.qty}</div>
          <div className="w-24 text-right text-gray-700">
            {cartonItem ? cartonItem.qty : "-"}
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recipe details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!recipeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Recipe not found</p>
        </div>
      </div>
    );
  }

  const sectionName = section.charAt(0).toUpperCase() + section.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Company Logo"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-full"
          />
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            S&B Nice Nice Food Valley Ltd.
          </h1>

          <div className="flex justify-center items-center gap-6 mb-4">
            <p className="text-gray-600">
              <span className="font-semibold">Section:</span> {sectionName}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Product:</span> {recipeData.name}
            </p>
          </div>

          {/* Export Buttons */}
          <RecipeActions
            recipeData={recipeData}
            section={section}
            materialsData={materialsData}
          />
        </div>

        {/* Product Information */}
        {recipeData.info && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Product Information
            </h2>
            <div className="space-y-3">
              {Object.entries(recipeData.info).map(([key, value], index) => {
                const formattedKey = key
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-600">{formattedKey}:</span>
                    <span className="font-semibold text-gray-900">
                      {value} {getInfoUnit(key)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Raw Materials Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Raw Materials</h2>
          </div>
          <div className="p-4">
            <div className="flex font-semibold text-gray-700 bg-gray-50 rounded-lg py-3 px-4 mb-2">
              <div className="flex-1">Name</div>
              <div className="w-20 text-center">Unit</div>
              <div className="w-24 text-right">Per Batch Qty</div>
              <div className="w-24 text-right">Per Carton Qty</div>
            </div>
            {renderMaterialTable(
              recipeData.rm || [],
              recipeData.carton_rm || [],
              materialsData.rm || []
            )}
          </div>
        </div>

        {/* Packaging Materials Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Packaging Materials
            </h2>
          </div>
          <div className="p-4">
            <div className="flex font-semibold text-gray-700 bg-gray-50 rounded-lg py-3 px-4 mb-2">
              <div className="flex-1">Name</div>
              <div className="w-20 text-center">Unit</div>
              <div className="w-24 text-right">Per Batch Qty</div>
              <div className="w-24 text-right">Per Carton Qty</div>
            </div>
            {renderMaterialTable(
              recipeData.pm || [],
              recipeData.carton_pm || [],
              materialsData.pm || []
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
