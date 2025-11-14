"use client";
import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { toast } from "sonner";

export default function ManageMaterials() {
  const { user } = useAuth();
  const [field, setField] = useState("rm");
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("biscuit");
  const [materials, setMaterials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editType, setEditType] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [sectionLoading, setSectionLoading] = useState(false);

  // Long press state management
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);

  const fields = [
    { label: "Raw Materials (RM)", value: "rm" },
    { label: "Packaging Materials (PM)", value: "pm" },
  ];

  const materialTypes = [
    { value: "rm", label: "RM" },
    { value: "carton", label: "Carton" },
    { value: "wrapper", label: "Wrapper" },
    { value: "tray", label: "Tray" },
    { value: "atc", label: "ATC Box" },
    { value: "gum_tape", label: "Gum Tape" },
    { value: "poly", label: "Poly (Inner/Master)" },
    { value: "paper", label: "Paper" },
    { value: "board", label: "Board" },
    { value: "sticker", label: "Sticker" },
    { value: "print", label: "Print Ink/Additive" },
  ];

  const periodId = getPeriodPath(user?.current_period);

  const main_material_collection_name = `${section}_${field}`;
  const period_material_collection_name = `${section}_${field}_period_${periodId}`;

  const period_material_collection_ref = collection(
    db,
    period_material_collection_name
  );

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

  // Firebase utility functions
  const updateDocument = async (collectionName, docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  };

  const deleteDocument = async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  };

  const handleFind = async () => {
    try {
      setLoading(true);
      setError(null);

      const querySnapshot = await getDocs(period_material_collection_ref);
      if (!querySnapshot.empty) {
        const materialsArray = [];
        querySnapshot.forEach((doc) => {
          materialsArray.push({ id: doc.id, ...doc.data() });
        });
        setMaterials(
          materialsArray.sort((a, b) => a.name.localeCompare(b.name))
        );
        console.log("Loaded materials from Firestore");
      } else {
        setMaterials([]);
        console.log("No materials found in Firestore");
      }
    } catch (err) {
      setError("Error fetching data: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete material function
  const deleteMaterial = async (materialId) => {
    setLoading(true);
    try {
      const updatedMaterials = materials.filter(
        (material) => material.id !== materialId
      );

      // Update Firestore
      await deleteDocument(main_material_collection_name, materialId);
      await deleteDocument(period_material_collection_name, materialId);

      // Update local state
      setMaterials(updatedMaterials);

      alert("Success: Material deleted successfully!");
    } catch (err) {
      console.error("Error deleting material:", err);
      alert("Error: Could not delete material: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle mouse/touch events for long press and double click
  const handleMouseDown = (material) => {
    const timer = setTimeout(() => {
      // Long press - delete material
      if (window.confirm(`Are you sure you want to delete "${material.name}"?`)) {
        deleteMaterial(material.id);
      }
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClick = (material) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
      // Double tap - edit material
      setSelectedMaterial(material);
      setEditName(material.name || "");
      setEditUnit(material.unit || "");
      setEditType(material.type || "");
      setEditPrice(material.price ? material.price.toString() : "");
      setEditModalVisible(true);
      setLastTapTime(0);
    } else {
      // Single tap - update last tap time
      setLastTapTime(now);
    }
  };

  // Combined handler for material interaction
  const handleMaterialInteraction = (material) => {
    handleClick(material);
  };

  // Update material function
  const updateMaterial = async () => {
    if (!editName.trim()) {
      return alert("Error: Material name cannot be empty");
    }

    setLoading(true);
    try {
      const updateData = {
        name: editName,
        unit: editUnit,
        type: editType,
        ...(editPrice && { price: parseFloat(editPrice) || 0 })
      };

      const updatedMaterials = materials.map((material) =>
        material.id === selectedMaterial.id
          ? { ...material, ...updateData }
          : material
      );

      // Update Firestore
      await updateDocument(main_material_collection_name, selectedMaterial.id, updateData);
      await updateDocument(period_material_collection_name, selectedMaterial.id, updateData);

      // Update local state
      setMaterials(updatedMaterials);
      setEditModalVisible(false);

      toast.success("Material updated successfully!");
    } catch (err) {
      console.error("Error updating material:", err);
      alert("Error: Could not update material: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  if (sectionLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-300">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Manage Materials</h1>
          
          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Section Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              >
                {sections.map((sectionItem) => (
                  <option key={sectionItem.value} value={sectionItem.value}>
                    {sectionItem.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Field Type Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Material Type
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              >
                {fields.map((fieldItem) => (
                  <option key={fieldItem.value} value={fieldItem.value}>
                    {fieldItem.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Find Materials Button */}
          <button
            onClick={handleFind}
            disabled={loading}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </div>
            ) : (
              "Find Materials"
            )}
          </button>
        </div>

        {/* Materials List */}
        {materials && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {field === "rm" ? "Raw Materials" : "Packaging Materials"}
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                  ({materials.length} items)
                </span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Double click to edit, long press to delete
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {materials.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {materials.map((material, i) => (
                    <div
                      key={material.id}
                      onMouseDown={() => handleMouseDown(material)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={() => handleMouseDown(material)}
                      onTouchEnd={handleMouseUp}
                      onClick={() => handleMaterialInteraction(material)}
                      className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150 flex items-center justify-between group select-none"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm transition-colors">
                            {i + 1}
                          </div>
                          <span className="text-gray-800 dark:text-white font-medium">
                            {material.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 ml-12">
                          {material.type && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full font-medium">
                              {material.type}
                            </span>
                          )}
                          {material.unit && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium">
                              {material.unit}
                            </span>
                          )}
                          {material.price && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                              ৳{material.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 dark:text-gray-500 mb-3">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No materials found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                      Please search for materials or check your section selection
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div className="text-gray-600 dark:text-gray-400">Loading materials...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4 transition-colors duration-300">
            <div className="flex items-center text-red-700 dark:text-red-400">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Material Modal */}
      {editModalVisible && (
        <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/80 bg-opacity-50 flex justify-center items-center z-50 p-4 transition-colors duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md transition-colors duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Edit Material</h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Material Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Material Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter material name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                />
              </div>

              {/* Unit Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit
                </label>
                <select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                >
                  <option value="">Select Unit</option>
                  <option value="kg">Kg</option>
                  <option value="pcs">Pcs</option>
                  <option value="rim">Rim</option>
                </select>
              </div>

              {/* Type Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                >
                  <option value="">Select Type</option>
                  {materialTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Enter price"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setEditModalVisible(false)}
                  className="flex-1 py-2 px-4 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={updateMaterial}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}