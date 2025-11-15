"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { toast } from "sonner"; // Sonner import করুন
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";

export default function AddMaterials() {
  const { user } = useAuth();
  const [field, setField] = useState("rm");
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [type, setType] = useState("rm");
  const [price, setPrice] = useState("");
  const [opening, setOpening] = useState("");
  const [materialsData, setMaterialsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fields = [
    { label: "Raw Materials (RM)", value: "rm" },
    { label: "Packaging Materials (PM)", value: "pm" },
  ];

  const units = [
    { label: "Kg", value: "kg" },
    { label: "Pcs", value: "pcs" },
    { label: "Rim", value: "rim" },
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

  // Firebase collection reference for current section and field
  const periodId = user?.current_period
    ? getPeriodPath(user.current_period)
    : null;
  
  const materialCollectionName = section && field ? `${section}_${field}` : null;

  const periodCollectionName =
    section && field && periodId
      ? `${section}_${field}_period_${periodId}`
      : null;
  
  const periodMaterialCollectionRef = periodCollectionName
    ? collection(db, periodCollectionName)
    : null;

  // Load sections dynamically from Firestore collection 'sections'
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
      toast.error("Failed to load sections");
      console.error("Failed to load sections:", error);
    } finally {
      setSectionLoading(false);
    }
  };

  // Load materials data from Firestore collection
  const loadMaterials = async () => {
    if (!periodMaterialCollectionRef) return;

    setLoading(true);
    try {
      console.log("Fetching materials from Firestore...");
      const querySnapshot = await getDocs(periodMaterialCollectionRef);
      if (!querySnapshot.empty) {
        const materialsArray = [];
        querySnapshot.forEach((doc) => {
          materialsArray.push({ id: doc.id, ...doc.data() });
        });
        setMaterialsData(
          materialsArray.sort((a, b) => a.name.localeCompare(b.name))
        );
        console.log("Loaded materials from Firestore");
      } else {
        setMaterialsData([]);
        console.log("No materials found in Firestore");
      }
    } catch (error) {
      toast.error("Could not load materials: " + error.message);
      console.error("Error loading materials:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add new material as a new document in Firestore collection
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please Insert Material name");
      return;
    }

    if (!section) {
      toast.error("Please select a section");
      return;
    }

    if (!field) {
      toast.error("Please select material type");
      return;
    }

    // Promise toast তৈরি করুন
    const promise = new Promise(async (resolve, reject) => {
      try {
        setLoading(true);
        const newMaterial = {
          name: name.trim(),
          unit,
          type,
          price: parseFloat(price) || 0,
          opening: parseFloat(opening) || 0,
          recieved_total: 0,
          recieved_days: Array.from({ length: 31 }, (_, i) => ({
            date: i + 1,
            qty: 0,
          })),
          consumption_total: 0,
          consumption_days: Array.from({ length: 31 }, (_, i) => ({
            date: i + 1,
            qty: 0,
          })),
          closing: 0,
        };

        if (!periodMaterialCollectionRef) {
          throw new Error("Invalid collection reference");
        }

        // Add new doc in Firestore
        const docRef = await addDoc(periodMaterialCollectionRef, newMaterial);
        const savedMaterial = { id: docRef.id, ...newMaterial };

        // Also create in main collection
        await Firebase.createDocWithName(materialCollectionName, docRef.id, newMaterial);

        // Update local state
        const updatedMaterials = [...materialsData, savedMaterial];
        setMaterialsData(
          updatedMaterials.sort((a, b) => a.name.localeCompare(b.name))
        );

        // Reset form
        setName("");
        setOpening("");
        setPrice("");
        setUnit("kg");
        setType("rm");

        resolve(savedMaterial);
      } catch (error) {
        reject(error);
      } finally {
        setLoading(false);
      }
    });

    // Toast প্রদর্শন করুন
    toast.promise(promise, {
      loading: 'Adding new material...',
      success: (data) => {
        return `"${data.name}" has been added successfully!`;
      },
      error: (error) => {
        return `Could not add material: ${error.message}`;
      },
    });
  };

  // Open modal function
  const openModal = () => {
    setModalVisible(true);
  };

  // Close modal function
  const closeModal = () => {
    setModalVisible(false);
  };

  // Load sections once on component mount
  useEffect(() => {
    fetchSections();
  }, []);

  // Load materials whenever section, field or period changes
  useEffect(() => {
    if (user?.current_period && section && field) {
      loadMaterials();
    }
  }, [section, field, user?.current_period]);

  if (sectionLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Add Materials</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6 transition-colors duration-300">
          {/* Material Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Material Type
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              {fields.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              {sections.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Material Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Material Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter material name"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            />
          </div>

          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {units.map((unitItem) => (
                <option key={unitItem.value} value={unitItem.value}>
                  {unitItem.label}
                </option>
              ))}
            </select>
          </div>

          {/* Material Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Material Category
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {materialTypes.map((typeItem) => (
                <option key={typeItem.value} value={typeItem.value}>
                  {typeItem.label}
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              step="0.01"
              min="0"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            />
          </div>

          {/* Opening Stock Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Opening Stock
            </label>
            <input
              type="number"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="Enter opening stock quantity"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
                loading 
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" 
                  : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adding...
                </div>
              ) : (
                "Add Material"
              )}
            </button>

            <button
              onClick={openModal}
              className="w-full py-3 px-4 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              View Materials ({materialsData.length})
            </button>
          </div>
        </div>

        {/* Materials Modal */}
        {modalVisible && (
          <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/80 bg-opacity-50 flex items-center justify-center z-50 p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col transition-colors duration-300">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Materials List ({materialsData.length} items)
                </h2>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {materialsData.length > 0 ? (
                  <div className="space-y-3">
                    {materialsData.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 dark:text-white mb-1">
                            {item.name}
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.type && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                                {item.type}
                              </span>
                            )}
                            {item.unit && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                {item.unit}
                              </span>
                            )}
                            {item.price > 0 && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                ৳{item.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No materials found.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
                <button
                  onClick={closeModal}
                  className="w-full py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-300">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Information:</h4>
          <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Materials are automatically saved to both main and period collections</li>
            <li>• Opening stock will be set to 0 if left empty</li>
            <li>• Price will be set to 0 if left empty</li>
            <li>• Materials are sorted alphabetically by name</li>
            <li>• Use &quot;View Materials&quot; to see all materials in the selected section</li>
          </ul>
        </div>
      </div>
    </div>
  );
}