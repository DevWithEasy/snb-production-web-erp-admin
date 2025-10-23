import { FaTimes } from "react-icons/fa";
import getSortingmaterials from "@/utils/sortingMaterials";
import { useState } from "react";

export default function AddMaterialModal({
  showModal,
  setShowModal,
  newMaterial,
  setNewMaterial,
  field,
  materials,
  selectProduct,
  addMaterialToRecipe,
  removeMaterialFromRecipe,
}) {
  const [longPressTimer, setLongPressTimer] = useState(null);

  if (!showModal) return null;

  const sortedMaterials = getSortingmaterials(materials, selectProduct[field]);

  const handleMouseDown = (material) => {
    const timer = setTimeout(() => {
      if (window.confirm("Remove item from recipe?")) {
        removeMaterialFromRecipe(material.id);
      }
    }, 500);
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
          <h3 className="text-xl font-bold text-gray-800">Add New Material</h3>
          <button
            onClick={() => {
              setShowModal(false);
              setNewMaterial({
                id: "",
                unit: "kg",
                qty: 0,
                cartonQty: 0,
              });
            }}
            className="p-2 hover:bg-white rounded-full transition-colors duration-200 text-gray-500 hover:text-red-500"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Material Selection */}
          <div className="space-y-4">
            <select
              value={newMaterial.id}
              onChange={(e) => {
                const selectedValue = e.target.value;
                const findItem = materials?.find((i) => i.id === selectedValue);
                setNewMaterial({
                  ...newMaterial,
                  id: selectedValue,
                  unit: findItem?.unit || "kg",
                });
              }}
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
            >
              <option value="">Select Material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>

            {/* Input Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Unit
                </label>
                <select
                  value={newMaterial.unit}
                  onChange={(e) => {
                    setNewMaterial({ ...newMaterial, unit: e.target.value });
                  }}
                  className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="kg">Kg</option>
                  <option value="pcs">Pcs</option>
                  <option value="rim">Rim</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Batch
                </label>
                <input
                  type="text"
                  className="w-full h-12 px-3 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  placeholder="0.00"
                  value={newMaterial.qty}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setNewMaterial({ ...newMaterial, qty: value });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Carton
                </label>
                <input
                  type="text"
                  className="w-full h-12 px-3 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  placeholder="0.00"
                  value={newMaterial.cartonQty}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setNewMaterial({ ...newMaterial, cartonQty: value });
                    }
                  }}
                />
              </div>
            </div>

            {/* Add Button */}
            <button
              className="w-full py-3 bg-linear-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              onClick={addMaterialToRecipe}
              disabled={!newMaterial.id || !newMaterial.qty}
            >
              Add to {field} Recipe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
