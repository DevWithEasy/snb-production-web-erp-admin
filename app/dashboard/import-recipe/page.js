"use client";
import Firebase from "@/utils/firebase";
import formatNumberExcel from "@/utils/formatNumberExcel";
import React, { useState, useRef, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import * as XLSX from "xlsx";
import ImportRecipeModal from "@/components/ImportRecipeModal";
import { FaRegCircleCheck } from "react-icons/fa6";
import { isEqual } from "lodash";

export default function ImportRecipe() {
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("");
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState({ rm: [], pm: [] });
  const [error, setError] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [product, setProduct] = useState(false);
  const [productArea, setProductArea] = useState("local");
  const [sectionSelected, setSectionSelected] = useState(false);
  const [imported,setImported] = useState([])

  const products_collection_name = `${section}_products`;
  const rm_collection_name = `${section}_rm`;
  const pm_collection_name = `${section}_pm`;

  // Fetch sections on component mount
  const fetchSections = async () => {
    try {
      setProductLoading(true);
      const sectionsData = await Firebase.getDocuments("sections");
      if (sectionsData && sectionsData.length > 0) {
        const sortedSections = sectionsData.sort((a, b) =>
          a.label?.localeCompare(b.label)
        );
        setSections(sortedSections);
        setProductLoading(false);
      } else {
        setError("No sections found in database");
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      setError("Failed to load sections");
    } finally {
      setProductLoading(false);
    }
  };

  // Fetch sections when component mounts
  useEffect(() => {
    fetchSections();
  }, []);

  // Fetch from Firestore
  const fetchFromFirestore = async (collectionName) => {
    try {
      const dataArray = await Firebase.getDocuments(collectionName);
      return dataArray
        ? dataArray.sort((a, b) => a.name?.localeCompare(b.name))
        : [];
    } catch (err) {
      console.error(`Fetch error for ${collectionName}:`, err);
      return [];
    }
  };

  const handleFind = async () => {
    if (!section) {
      setError("Please select a section first");
      return;
    }

    setProductLoading(true);
    setError(null);
    try {
      // Fetch data directly from Firestore
      const [products, rmData, pmData] = await Promise.all([
        fetchFromFirestore(products_collection_name),
        fetchFromFirestore(rm_collection_name),
        fetchFromFirestore(pm_collection_name),
      ]);

      if (products.length === 0) {
        setError("No Products Found. Reload this screen");
      }

      if (rmData.length === 0 && pmData.length === 0) {
        setError("No materials found for this section.");
      }

      setProducts(products.sort((a, b) => a.name.localeCompare(b.name)));
      setSectionSelected(true);

      setMaterials({
        rm: rmData.map((material) => {
          const { id, name, unit } = material;
          return {
            unit,
            id,
            name,
          };
        }),
        pm: pmData.map((material) => {
          const { id, name, unit } = material;
          return {
            name,
            id,
            unit,
          };
        }),
      });

      console.log("Loaded materials from Firestore successfully");
    } catch (err) {
      setError("Error fetching materials: " + err.message);
      console.error(err);
    } finally {
      setProductLoading(false);
    }
  };

  // File input reference যোগ করুন
  const fileInputRef = useRef(null);

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
      readExcelFile(file);
    }
  };

  // Read Excel file
  const readExcelFile = (file) => {
    setLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheets = workbook.SheetNames;
        const recipeData = [];

        for (const sheet of sheets) {
          // Skip specific sheets but continue with other sheets
          if (
            sheet === "Home" ||
            sheet === "Cream & Syrup" ||
            sheet === "Spray Mixer"
          ) {
            continue; // Skip this sheet but continue with next sheets
          }

          const worksheet = workbook.Sheets[sheet];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Check if the sheet has at least one row with data
          if (jsonData.length === 0) continue;

          //get product info
          const [id, name, rmStart, rmEnd, pmStart, pmEnd] = jsonData[0].filter(
            (v) => v != null && v !== ""
          );

          // Skip if essential product info is missing
          if (!id || !name) continue;

          const productInfo = { id, name, rmStart, rmEnd, pmStart, pmEnd };

          const rawMaterials = jsonData
            .slice(rmStart - 1, rmEnd)
            .filter(
              (row) =>
                row[0] != null &&
                row[0] !== "" &&
                row[4] != null &&
                row[4] !== "" &&
                row[5] != null &&
                row[5] !== ""
            )
            .map((material) => {
              return {
                id: material[0],
                name: material[2],
                unit: material[3],
                batch: formatNumberExcel(material[4], 4),
                carton: formatNumberExcel(material[5], 5),
              };
            });

          const packingMaterials = jsonData
            .slice(pmStart - 1, pmEnd)
            .filter((row) => row[0] != null && row[0] !== "")
            .map((material) => {
              return {
                id: material[0],
                name: material[2],
                unit: material[3],
                batch: formatNumberExcel(material[4], 4),
                carton: formatNumberExcel(material[5], 5),
              };
            });

          const product = {
            id,
            name,
            rm: rawMaterials.map((material) => {
              const { batch, carton, ...data } = material;
              return {
                ...data,
                qty: batch,
              };
            }),
            carton_rm: rawMaterials.map((material) => {
              const { batch, carton, ...data } = material;
              return {
                ...data,
                qty: carton,
              };
            }),
            pm: packingMaterials.map((material) => {
              const { batch, carton, ...data } = material;
              return {
                ...data,
                qty: batch,
              };
            }),
            carton_pm: packingMaterials.map((material) => {
              const { batch, carton, ...data } = material;
              return {
                ...data,
                qty: carton,
              };
            }),
          };
          recipeData.push(product);
        }
        setExcelData(recipeData.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert(
          "Error reading Excel file. Please make sure it's a valid Excel file."
        );
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error("File reading error:", error);
      alert("Error reading file.");
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Clear file selection manually
  const handleClearFile = () => {
    setExcelFile(null);
    setExcelData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Reset section selection
  const handleResetSection = () => {
    setSection("");
    setSectionSelected(false);
    setProducts([]);
    setMaterials({ rm: [], pm: [] });
    setError(null);
  };

  return (
    <div className="h-[calc(100vh-65px)] flex bg-gray-50 overflow-hidden">
      {/* Left Panel - Excel Import */}
      <div className="w-1/2 h-[calc(100vh-65px)] overflow-y-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-scrollbar]:hidden border-r border-gray-200">
        {/* Section Selection for Excel Import */}
        {!sectionSelected && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Select Section First
              </h2>
              <p className="text-gray-600">
                Please select a section to enable Excel import functionality
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Section
              </label>
              <div className="flex">
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="flex-1 h-12 px-3 border border-gray-300 rounded-l-lg bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={productLoading}
                >
                  <option value="">Select a section</option>
                  {sections.map((sectionItem) => (
                    <option key={sectionItem.value} value={sectionItem.value}>
                      {sectionItem.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleFind}
                  disabled={!section || productLoading}
                  className="flex items-center justify-center bg-blue-600 text-white h-12 w-12 border-none rounded-r-lg cursor-pointer text-sm transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Load Section Data"
                >
                  {productLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaSearch className="text-base" />
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center text-red-700">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Excel Import Section - Only show when section is selected */}
        {sectionSelected && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  Import Recipe from Excel
                </h1>
                <button
                  onClick={handleResetSection}
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Change Section
                </button>
              </div>
              <p className="text-gray-600">
                Upload your Excel file and specify required Format
              </p>
              <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                Section: {sections.find((s) => s.value === section)?.label}
              </div>
            </div>

            {/* Main Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <form className="space-y-6">
                {/* File Upload Section */}
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-2 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                      📄 Excel File Upload
                    </h3>
                    {/* Clear file button - শুধু যখন ফাইল সিলেক্টেড থাকে */}
                    {excelFile && (
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200"
                      >
                        Clear File
                      </button>
                    )}
                  </div>

                  {!excelData && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="excel-file"
                        ref={fileInputRef}
                      />

                      <label
                        htmlFor="excel-file"
                        className="cursor-pointer block"
                      >
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                          </div>

                          <div>
                            <p className="text-lg font-medium text-gray-700">
                              {excelFile ? excelFile.name : "Choose Excel File"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {excelFile
                                ? "File selected"
                                : "Click to upload .xlsx or .xls file"}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Reading Excel file...</span>
                    </div>
                  )}

                  {excelData && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-green-700">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-medium">
                          Excel file loaded successfully!
                        </span>
                      </div>
                      <p className="text-gray-700">{excelFile.name}</p>
                      <p className="text-green-600 text-sm mt-1">
                        Recipe Found: {excelData.length}
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {excelData && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-4 space-y-2">
                <p className="text-lg font-medium border-b border-gray-200">
                  Products from Excel
                </p>
                <table className="w-full">
                  <tbody>
                    {excelData?.map((product) => {
                      const find = imported.find(prodId=> prodId === product.id)
                      return(
                      <tr
                        key={product.id}
                        className={`cursor-pointer border border-gray-200 hover:bg-gray-50 ${find ? 'bg-green-50' : ''}`}
                        onClick={() => {
                          setVisible(true);
                          setProduct(product);
                          setProductArea("local");
                        }}
                      >
                        <td className="p-3">{product?.id?.slice(-4)}</td>
                        <td className="p-3">{product?.name}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}

            {/* Instructions */}
            {!excelData && (
              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  💡 How to use:
                </h3>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li>• Upload your Excel file containing the recipe data</li>
                  <li>• Click on any product to view and import materials</li>
                  <li>
                    • Use &quot;Clear File&quot; to remove current selection
                  </li>
                  <li>• Use &quot;Change Section&quot; to switch sections</li>
                </ul>
              </div>
            )}
          </>
        )}

        <ImportRecipeModal
          visible={visible}
          setVisible={setVisible}
          products={products}
          product={product}
          productArea={productArea}
          materials={materials}
          section={section}
          setImported={setImported}
        />
      </div>

      {/* Right Panel - Firebase Products */}
      <div className="w-1/2 h-[calc(100vh-65px)] overflow-y-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-scrollbar]:hidden">
        {/* Section Selection for Firebase */}
        {!sectionSelected ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                View Products from Database
              </h2>
              <p className="text-gray-600 mb-6">
                Select a section to view products and materials from Firebase
              </p>

              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Section
                </label>
                <div className="flex">
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="flex-1 h-12 px-3 border border-gray-300 rounded-l-lg bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={productLoading}
                  >
                    <option value="">Select a section</option>
                    {sections.map((sectionItem) => (
                      <option key={sectionItem.value} value={sectionItem.value}>
                        {sectionItem.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleFind}
                    disabled={!section || productLoading}
                    className="flex items-center justify-center bg-blue-600 text-white h-12 w-12 border-none rounded-r-lg cursor-pointer text-sm transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Load Products & Materials"
                  >
                    {productLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FaSearch className="text-base" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search Section Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Products from Database
                  </h2>
                  <p className="text-sm text-gray-600">
                    Section: {sections.find((s) => s.value === section)?.label}
                  </p>
                </div>
                <button
                  onClick={handleResetSection}
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Change Section
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center text-red-700">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Products List */}
            {products.length > 0 && (
              <div className="space-y-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-lg font-medium border-b border-gray-200 pb-2">
                    Available Products ({products.length})
                  </p>
                  <table className="w-full mt-4">
                    <tbody>
                      {products?.map((product) => {
                        const find = excelData?.find(
                          (p) => p.id === product.id
                        );
                        return (
                          <tr
                            key={product.id}
                            className={`cursor-pointer border border-gray-200 hover:bg-gray-50 ${
                              find ? "bg-green-50" : "bg-red-50"
                            }`}
                            onClick={() => {
                              setVisible(true);
                              setProduct(product);
                              setProductArea("firebase");
                            }}
                          >
                            {find && (
                              <td className="p-3">
                                <FaRegCircleCheck
                                  size={18}
                                  className="text-green-500"
                                />
                              </td>
                            )}
                            <td className="p-3 font-medium">
                              {product?.id?.slice(-4)}
                            </td>
                            <td className="p-3">{product?.name}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
