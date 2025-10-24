"use client";
import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";

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
  const [sectionLoading, setSectionLoading] = useState(false);

  // Long press state management
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);

  const fields = [
    { label: "Raw Materials (RM)", value: "rm" },
    { label: "Packaging Materials (PM)", value: "pm" },
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
      setEditName(material.name);
      setEditUnit(material.unit);
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
      const updatedMaterials = materials.map((material) =>
        material.id === selectedMaterial.id
          ? { ...material, name: editName, unit: editUnit }
          : material
      );

      // Update Firestore
      await updateDocument(main_material_collection_name, selectedMaterial.id, {
        name: editName,
        unit: editUnit
      });
      await updateDocument(period_material_collection_name, selectedMaterial.id, {
        name: editName,
        unit: editUnit
      });

      // Update local state
      setMaterials(updatedMaterials);
      setEditModalVisible(false);

      alert("Success: Material updated successfully!");
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Manage Materials</h1>
          
          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Section Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Type
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {loading ? "Loading..." : "Find Materials"}
          </button>
        </div>

        {/* Materials List */}
        {materials && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {field === "rm" ? "Raw Materials" : "Packaging Materials"}
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({materials.length} items)
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Double click to edit, long press to delete
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {materials.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {materials.map((material, i) => (
                    <div
                      key={material.id}
                      onMouseDown={() => handleMouseDown(material)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={() => handleMouseDown(material)}
                      onTouchEnd={handleMouseUp}
                      onClick={() => handleMaterialInteraction(material)}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 flex items-center justify-between group select-none"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                          {i + 1}
                        </div>
                        <span className="text-gray-800 font-medium">
                          {material.name}
                        </span>
                      </div>
                      
                      {material.unit && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                          {material.unit}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-3">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">No materials found</p>
                    <p className="text-gray-400 text-sm mt-1">
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
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div className="text-gray-600">Loading materials...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-center text-red-700">
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
        <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Edit Material</h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Material Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter material name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Unit Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select Unit</option>
                  <option value="kg">Kg</option>
                  <option value="pcs">Pcs</option>
                  <option value="rim">Rim</option>
                  <option value="ltr">Ltr</option>
                  <option value="gm">Gm</option>
                  <option value="ml">Ml</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setEditModalVisible(false)}
                  className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={updateMaterial}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}