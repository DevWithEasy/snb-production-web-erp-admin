"use client";
import LoadingScreen from "@/components/LoadingScreen";
import ServerLoading from "@/components/ServerLoading";
import ActionButton from "@/components/recipe_update/ActionButton";
import AddMaterialModal from "@/components/recipe_update/AddMaterialModal";
import InfoUpdate from "@/components/recipe_update/InfoUpdate";
import MaterialUpdateModal from "@/components/recipe_update/MaterialUpdateModal";
import MaterialsView from "@/components/recipe_update/MaterialsView";
import SearchAndProductSelect from "@/components/recipe_update/SearchAndProductSelect";
import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function UpdateRecipe() {
  const { user } = useAuth();
  const [field, setField] = useState("rm");
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("biscuit");
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [selectRefProduct, setSelectRefProduct] = useState({});
  const [selectProduct, setSelectProduct] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showProductInfo, setShowProductInfo] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    id: "",
    unit: "kg",
    qty: 0,
    cartonQty: 0,
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editMaterial, setEditMaterial] = useState({
    id: "",
    unit: "kg",
    qty: "",
    cartonQty: "",
  });

  // Mobile state
  const [showMaterialsPanel, setShowMaterialsPanel] = useState(false);

  // Drag and Drop state
  const [draggedMaterial, setDraggedMaterial] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const getField = (field) => {
    if (field === "rm" || field === "carton_rm") {
      return "rm";
    } else if (field === "pm" || field === "carton_pm") {
      return "pm";
    }
  };

  const periodId = getPeriodPath(user?.current_period);

  const main_products_collection_name = `${section}_products`;
  const period_products_collection_name = `${section}_products_period_${periodId}`;

  // Drag and Drop Handlers
  const handleDragStart = (e, material) => {
    setDraggedMaterial(material);
    e.dataTransfer.setData("text/plain", material.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (draggedMaterial) {
      handleAddMaterialFromDrag(draggedMaterial);
    } else {
      // Fallback: try to get data from dataTransfer
      const materialId = e.dataTransfer.getData("text/plain");
      const material = materials.find((m) => m.id === materialId);
      if (material) {
        handleAddMaterialFromDrag(material);
      }
    }
  };

  // Function to handle adding material from drag and drop
  const handleAddMaterialFromDrag = (material) => {
    if (!material) return;

    const findItem = selectProduct[field]?.find(
      (item) => item.id === material.id
    );

    if (findItem) {
      alert("Already Exist: This item is already added");
      return;
    }

    // Set the new material with default values
    setNewMaterial({
      id: material.id,
      unit: material.unit || "kg",
      qty: 0,
      cartonQty: 0,
    });

    // Automatically add to recipe after a short delay
    setTimeout(() => {
      setShowModal(!showModal);
    }, 100);
  };

  const fetchSections = async () => {
    setSectionLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "sections"));
      const sectionsData = snapshot.docs.map((doc) => doc.data());
      const sortedSections = sectionsData.sort((a, b) =>
        a.label.localeCompare(b.label)
      );
      setSections(sortedSections);
      if (!section && sortedSections.length > 0)
        setSection(sortedSections[0].value);
    } catch (error) {
      alert("Error: Failed to load sections");
      console.error("Failed to load sections:", error);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleFind = async () => {
    try {
      setLoading(true);
      setError(null);

      const [products, materials] = await Promise.all([
        Firebase.getDocuments(period_products_collection_name),
        Firebase.getDocuments(
          `${section}_${getField(field)}_period_${periodId}`
        ),
      ]);

      if (products) {
        setProducts(products.sort((a, b) => a.name.localeCompare(b.name)));
        if (products.length > 0) {
          setProduct(products[0].id);
          setSelectProduct(products[0]);
          setSelectRefProduct(products[0]);
        }
      } else {
        setError("No recipe found for section: " + section);
      }

      if (materials) {
        setMaterials(materials.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        console.log("No materials found for section: " + section);
        setMaterials([]);
      }

      console.log("Loaded data from Firestore successfully");
    } catch (err) {
      setError("Error fetching data: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectMaterials = async (currentField) => {
    setLoading(true);
    try {
      const materialCollectionName = `${section}_${getField(
        currentField
      )}_period_${periodId}`;

      const materialsFromFirebase = await Firebase.getDocuments(
        materialCollectionName
      );
      if (materialsFromFirebase) {
        setMaterials(
          materialsFromFirebase.sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        setMaterials([]);
        console.log("No materials found in Firebase for field:", currentField);
      }
    } catch (err) {
      console.error("Error loading materials:", err);
      setError("Error loading materials: " + err.message);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (window.confirm("Are you sure you want to update this recipe?")) {
      try {
        setUpdating(true);

        // Update local state
        const updatedProducts = products.map((p) =>
          p.id === selectProduct.id ? selectProduct : p
        );
        setProducts(updatedProducts);
        setSelectRefProduct(selectProduct);

        // Update Firestore
        const { id, ...updatedField } = selectProduct;
        await Firebase.updateDocument(
          main_products_collection_name,
          selectProduct.id,
          updatedField
        );
        await Firebase.updateDocument(
          period_products_collection_name,
          selectProduct.id,
          updatedField
        );

        toast.success("Recipe updated successfully!");
      } catch (error) {
        console.error("Error updating recipe:", error);
        alert("Error: Failed to update recipe: " + error.message);
      } finally {
        setUpdating(false);
      }
    }
  };

  const addMaterialToRecipe = () => {
    const findItem = selectProduct[field]?.find(
      (item) => item.id === newMaterial.id
    );
    if (findItem) {
      return alert("Already Exist: This item is already added");
    }
    if (!newMaterial.qty || parseFloat(newMaterial.qty) <= 0) {
      return alert("Invalid Quantity: Please enter a valid quantity");
    }
    const cartonField = `carton_${getField(field)}`;
    const { cartonQty, ...batchItem } = newMaterial;
    const cartonItem = {
      id: newMaterial.id,
      unit: newMaterial.unit,
      qty: newMaterial.cartonQty,
    };

    const batchItems = [...(selectProduct[field] || []), batchItem];
    const cartonItems = [...(selectProduct[cartonField] || []), cartonItem];

    const updatedRecipe = {
      ...selectProduct,
      [field]: batchItems,
      [cartonField]: cartonItems,
    };
    setSelectProduct(updatedRecipe);
    setNewMaterial({ id: "", unit: "kg", qty: 0, cartonQty: 0 });
    setDraggedMaterial(null);
    setShowModal(false);
  };

  const removeMaterialFromRecipe = (materialId) => {
    if (window.confirm("Remove item from recipe?")) {
      const cartonField = `carton_${getField(field)}`;

      const batchFilterItems = (selectProduct[field] || []).filter(
        (item) => item.id !== materialId
      );

      const cartonFilterItems = (selectProduct[cartonField] || []).filter(
        (item) => item.id !== materialId
      );

      const updated = {
        ...selectProduct,
        [field]: batchFilterItems,
        [cartonField]: cartonFilterItems,
      };
      setSelectProduct(updated);
    }
  };

  const handleSaveEditMaterial = () => {
    if (
      !editMaterial.qty ||
      isNaN(parseFloat(editMaterial.qty)) ||
      parseFloat(editMaterial.qty) <= 0
    ) {
      return alert("Invalid Quantity: Please enter a valid quantity");
    }

    const cartonField = `carton_${getField(field)}`;

    const updatedBatchItems = (selectProduct[getField(field)] || []).map(
      (item) => {
        if (item.id === editMaterial.id) {
          return {
            ...item,
            qty: parseFloat(editMaterial.qty),
            unit: editMaterial.unit,
          };
        }
        return item;
      }
    );

    const updatedCartonItems = (selectProduct[cartonField] || []).map(
      (item) => {
        if (item.id === editMaterial.id) {
          return {
            ...item,
            qty: parseFloat(editMaterial.cartonQty),
            unit: editMaterial.unit,
          };
        }
        return item;
      }
    );

    setSelectProduct({
      ...selectProduct,
      [field]: updatedBatchItems,
      [cartonField]: updatedCartonItems,
    });
    setEditModalVisible(false);
  };

  const handleOpenEditModal = (material) => {
    const cartonField = `carton_${getField(field)}`;

    const batchItem = (selectProduct[getField(field)] || []).find(
      (item) => item.id === material.id
    );

    const cartonItem = (selectProduct[cartonField] || []).find(
      (item) => item.id === material.id
    );

    if (!cartonItem) {
      setSelectProduct({
        ...selectProduct,
        [cartonField]: [
          ...(selectProduct[cartonField] || []),
          {
            id: batchItem.id,
            unit: batchItem.unit,
            qty: 0,
          },
        ],
      });
    }

    setEditMaterial({
      id: material.id,
      unit: material.unit,
      qty: batchItem.qty,
      cartonQty: cartonItem?.qty || 0,
    });
    setEditModalVisible(true);
  };

  const handleInfoChange = (key, value) => {
    setSelectProduct((prev) => ({
      ...prev,
      info: {
        ...prev.info,
        [key]: value,
      },
    }));
  };

  const lastTap = useRef(null);
  const handleMaterialPress = (material) => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      handleOpenEditModal(material);
    } else {
      lastTap.current = now;
    }
  };

  // Mobile toggle for materials panel
  const toggleMaterialsPanel = () => {
    setShowMaterialsPanel(!showMaterialsPanel);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  if (sectionLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <ServerLoading visible={updating} message="Recipe updating" />
      
      {/* Mobile Materials Toggle Button */}
      <div className="lg:hidden fixed top-16 right-4 z-30">
        <button
          onClick={toggleMaterialsPanel}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <span className="text-sm font-medium">
            {showMaterialsPanel ? "Hide" : "Show"} Materials
          </span>
        </button>
      </div>

      {/* Main Container with Responsive Layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)]">
        {/* Left Section - Recipe Editor */}
        <div className="w-full lg:w-8/12 h-full flex flex-col border-r border-gray-200 bg-white">
          {/* Fixed Header Section */}
          <div className="flex-shrink-0 bg-white p-4 lg:p-6 border-b border-gray-200">
            <SearchAndProductSelect
              sections={sections}
              section={section}
              setSection={setSection}
              handleFind={handleFind}
              setProducts={setProducts}
              setSelectProduct={setSelectProduct}
              setSelectRefProduct={setSelectRefProduct}
              products={products}
              product={product}
              setProduct={setProduct}
              field={field}
              setField={setField}
              loadSelectMaterials={loadSelectMaterials}
              loading={loading}
            />
          </div>

          {/* Scrollable Content Area with Drop Zone */}
          <div
            className={`flex-1 overflow-y-auto ${
              isDragOver ? "bg-blue-100" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-3 lg:p-4">
              {products.length > 0 ? (
                <>
                  <ActionButton
                    showProductInfo={showProductInfo}
                    setShowProductInfo={setShowProductInfo}
                    field={field}
                    showModal={showModal}
                    setShowModal={setShowModal}
                    getField={getField}
                    selectRefProduct={selectRefProduct}
                    selectProduct={selectProduct}
                    handleUpdate={handleUpdate}
                    updating={updating}
                  />

                  {selectProduct.rm && !showProductInfo && (
                    <MaterialsView
                      showProductInfo={showProductInfo}
                      setShowProductInfo={setShowProductInfo}
                      showModal={showModal}
                      setShowModal={setShowModal}
                      field={field}
                      getField={getField}
                      selectProduct={selectProduct}
                      materials={materials}
                      removeMaterialFromRecipe={removeMaterialFromRecipe}
                      handleMaterialPress={handleMaterialPress}
                    />
                  )}

                  {showProductInfo && (
                    <InfoUpdate
                      infos={selectProduct.info}
                      handleInfoChange={handleInfoChange}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-8 lg:py-12">
                  <div className="text-gray-500 text-base lg:text-lg">
                    No products found. Please search for recipes.
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-6 lg:py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <div className="text-gray-600 text-sm lg:text-base">
                    Loading recipes and materials...
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4 text-red-700 text-center text-sm lg:text-base">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Materials List */}
        {materials.length > 0 && (
          <div className={`
            w-full lg:w-4/12 h-full flex flex-col bg-white border-t lg:border-t-0 border-gray-200
            fixed lg:relative inset-0 z-20 transform transition-transform duration-300 ease-in-out
            ${showMaterialsPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile Header with Close Button */}
            <div className="flex-shrink-0 p-4 lg:p-6 border-b border-gray-200 bg-white flex justify-between items-center lg:block">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Available Materials ({materials.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  All materials for {section} section
                </p>
              </div>
              <button
                onClick={toggleMaterialsPanel}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Backdrop */}
            {showMaterialsPanel && (
              <div 
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
                onClick={toggleMaterialsPanel}
              />
            )}

            {/* Scrollable Materials List */}
            <div className="flex-1 overflow-y-auto bg-white relative z-20">
              <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">
                {materials.map((material, i) => (
                  <div
                    key={material?.id || i}
                    className="p-3 lg:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200 cursor-pointer touch-manipulation"
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, material)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleDragStart(e, material);
                    }}
                    onClick={() => {
                      // On mobile, add material directly on click
                      if (window.innerWidth < 1024) {
                        handleAddMaterialFromDrag(material);
                      }
                    }}
                    title={`${window.innerWidth < 1024 ? 'Tap to add' : 'Drag to add'} ${material.name} to recipe`}
                  >
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span className="font-medium text-gray-800 text-xs lg:text-sm">
                        {material?.name}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {material?.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddMaterialModal
        showModal={showModal}
        setShowModal={setShowModal}
        newMaterial={newMaterial}
        setNewMaterial={setNewMaterial}
        field={field}
        materials={materials}
        selectProduct={selectProduct}
        addMaterialToRecipe={addMaterialToRecipe}
        removeMaterialFromRecipe={removeMaterialFromRecipe}
      />

      <MaterialUpdateModal
        editModalVisible={editModalVisible}
        setEditModalVisible={setEditModalVisible}
        materials={materials}
        field={field}
        editMaterial={editMaterial}
        setEditMaterial={setEditMaterial}
        handleSaveEditMaterial={handleSaveEditMaterial}
      />
    </div>
  );
}