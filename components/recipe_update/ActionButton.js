import { isEqual } from "lodash";
import React from "react";

export default function ActionButton({showProductInfo,setShowProductInfo,field,showModal,getField,setShowModal,selectRefProduct,selectProduct,handleUpdate,updating}) {
  return (
    <div className="flex flex-wrap gap-3 justify-end items-center mb-4">
      {/* Info/Materials Toggle Button */}
      <button
        onClick={() => setShowProductInfo(!showProductInfo)}
        className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          showProductInfo
            ? "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
            : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
        }`}
      >
        {showProductInfo ? "Materials" : "Info"}
      </button>

      {/* Update Recipe Button */}
      {!isEqual(selectRefProduct, selectProduct) && (
        <button
          onClick={handleUpdate}
          disabled={updating}
          className={`px-4 py-2 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            updating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
          }`}
        >
          {updating ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Updating...
            </span>
          ) : (
            "Update"
          )}
        </button>
      )}
    </div>
  );
}
