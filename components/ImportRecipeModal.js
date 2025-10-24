"use client";
import { IoIosCloseCircle } from "react-icons/io";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import getPeriodPath from "@/utils/getPeriodPath";
import { db } from "@/utils/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import ServerLoading from "./ServerLoading";

export default function ImportRecipeModal({
  visible,
  setVisible,
  products,
  product,
  productArea,
  materials,
  section,
}) {
  const { user } = useAuth();
  const [field, setField] = useState("rm");
  const [updating,setUpdating] = useState(false)

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
  };

  const handleImport = async () => {
    if (!section) {
      return alert("No Section select");
    }
    const find = products.find((p) => p.id === product.id);
    if (!find) {
      return alert("Please section section and Load products");
    }
    setUpdating(true)
    try {
      const periodId = getPeriodPath(user?.current_period);

      const main_products_collection_name = `${section}_products`;
      const period_products_collection_name = `${section}_products_period_${periodId}`;

      const updatedData = {
        rm: product["rm"].map((item) => {
          const { name, ...others } = item;
          return others;
        }),
        carton_rm: product["carton_rm"].map((item) => {
          const { name, ...others } = item;
          return others;
        }),
        pm: product["pm"].map((item) => {
          const { name, ...others } = item;
          return others;
        }),
        carton_pm: product["carton_pm"].map((item) => {
          const { name, ...others } = item;
          return others;
        }),
      };

      const mainRef = doc(db, main_products_collection_name, product.id);
      const periodRef = doc(db, period_products_collection_name, product.id);

      await updateDoc(mainRef, {
        ...updatedData
      });

      await updateDoc(periodRef, {
        ...updatedData
      });
      setUpdating(false)
      setVisible(false)
    } catch (error) {
      console.log(error);
      setUpdating(false)
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <ServerLoading visible={updating} message='Recepi Importing from Excel'/>
      <div className="relative bg-white rounded-xl flex flex-col w-full max-w-4xl h-full max-h-[90vh] shadow-lg">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {product?.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{productArea}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <IoIosCloseCircle size={28} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Material Type Selector */}
            <div className="">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Type
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="rm">Raw Materials (RM)</option>
                <option value="pm">Packaging Materials (PM)</option>
              </select>
            </div>

            {/* Materials Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Carton Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {product[field]?.map((material, i) => {
                      const findItem = materials[field]?.find(
                        (item) => item.id == material.id
                      );
                      const cartonItem = product[`carton_${field}`]?.find(
                        (item) => item.id == material.id
                      );

                      return (
                        <tr
                          key={material.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {i + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">
                                {productArea == "local"
                                  ? material.name
                                  : findItem?.name || "N/A"}
                              </div>
                              {/* <div className="text-xs text-gray-500">ID: {material.id}</div> */}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {material.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-semibold">
                              {material.qty}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-semibold text-green-600">
                              {cartonItem?.qty || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {(!product[field] || product[field].length === 0) && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No materials found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    No{" "}
                    {field === "rm" ? "raw materials" : "packaging materials"}{" "}
                    added to this product
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        {productArea !== "firebase" && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-xl">
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Import Recipe
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
