import { useState } from "react";
import getSortingmaterials from "../../utils/sortingMaterials";

export default function MaterialsView({
  showProductInfo,
  setShowProductInfo,
  showModal,
  setShowModal,
  field,
  getField,
  selectProduct,
  materials,
  removeMaterialFromRecipe,
  handleMaterialPress,
}) {
  const [longPressTimer, setLongPressTimer] = useState(null);
  const cartonField = `carton_${field}`;
  const total =
    selectProduct[field]?.reduce((acc, curr) => acc + Number(curr.qty), 0) || 0;
  const cartonTotal =
    selectProduct[cartonField]?.reduce(
      (acc, curr) => acc + Number(curr.qty),
      0
    ) || 0;
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

  const handleClick = (material) => {
    handleMaterialPress(material);
  };

  return (
    <div className="pb-12">
      {/* Instruction Text */}
      <div className="italic text-xs text-gray-400 mb-4 text-center">
        Double Click to update and Long Press to delete item
      </div>

      {/* Materials Header */}
      <div className="flex justify-between bg-gray-200 px-2 py-2.5 rounded-t-lg font-semibold">
        <div className="flex-1">Name</div>
        <div className="w-15 text-center">Unit</div>
        <div className="w-20 text-right">Batch Qty</div>
        <div className="w-30 text-right">Carton Qty</div>
      </div>

      {/* Materials List */}
      {selectProduct[field]?.length > 0 ? (
        <div className="border border-gray-200 border-t-0 overflow-hidden">
          {sortedMaterials?.map((material, i) => {
            const cartonField = `carton_${field}`;
            const findCatonItem = selectProduct[cartonField].find(
              (item) => item.id === material.id
            );
            return (
              <div
                key={i}
                className="flex justify-between items-center px-2 py-3 border-b border-gray-100 bg-white cursor-pointer transition-colors duration-200 hover:bg-gray-50 last:border-b-0"
                onMouseDown={() => handleMouseDown(material)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={() => handleClick(material)}
              >
                <div className="flex-1 truncate pr-2" title={material?.name}>
                  {material?.name}
                </div>
                <div className="w-15 text-center text-sm">{material?.unit}</div>
                <div className="w-20 text-right font-medium">
                  {material?.qty}
                </div>
                <div className="w-30 text-right font-medium">
                  {findCatonItem?.qty}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-5 py-5 bg-white rounded-lg border border-gray-200">
          No {field} materials found!
        </div>
      )}

      {/* Total Row */}
      {selectProduct[field]?.length > 0 &&
        (field === "rm" || field === "carton_rm") && (
          <div className="flex justify-between bg-gray-200 px-2 py-2.5 font-semibold">
            <div className="flex-1">Total</div>
            <div className="w-15 text-center"></div>
            <div className="w-20 text-right">{total.toFixed(2)}</div>
            <div className="w-30 text-right">{cartonTotal.toFixed(4)}</div>
          </div>
        )}
    </div>
  );
}
