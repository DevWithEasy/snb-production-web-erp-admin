"use client";
import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaUpload, FaCheck, FaSpinner, FaExclamationTriangle, FaRedo } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function ImportProductsMaterials() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Progress tracking state
  const [importProgress, setImportProgress] = useState({
    currentSection: '',
    completedSections: [],
    failedSections: [],
    currentAction: '',
    processedItems: 0,
    totalItems: 0
  });

  // Individual section processing state
  const [processingSections, setProcessingSections] = useState({});

  const periodId = getPeriodPath(user?.current_period);

  // Fetch sections on component mount
  const fetchSections = async () => {
    try {
      setLoading(true);
      const sectionsData = await Firebase.getDocuments("sections");
      if (sectionsData && sectionsData.length > 0) {
        const sortedSections = sectionsData.sort((a, b) =>
          a.label?.localeCompare(b.label)
        );
        setSections(sortedSections);
      } else {
        setError("No sections found in database");
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      setError("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // Handle file import
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportLoading(true);
    setError(null);
    setSuccessMessage(null);
    setImportProgress({
      currentSection: '',
      completedSections: [],
      failedSections: [],
      currentAction: '',
      processedItems: 0,
      totalItems: 0
    });
    setProcessingSections({});

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const importedData = {};

        // Process each sheet (each section)
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          importedData[sheetName] = {
            products: jsonData.filter((item) => item.Type === "TV"),
            rm: jsonData.filter((item) => item.Type === "RM"),
            pm: jsonData.filter((item) => item.Type === "PM"),
          };
        });

        setImportData(importedData);
        console.log("Imported data:", importedData);
      } catch (err) {
        setError("Error reading Excel file: " + err.message);
        console.error(err);
      } finally {
        setImportLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Calculate total items for progress tracking
  const calculateTotalItems = (data) => {
    let total = 0;
    Object.values(data).forEach(sectionData => {
      total += sectionData.rm.length + sectionData.pm.length;
    });
    return total;
  };

  // Calculate items for a specific section
  const calculateSectionItems = (sectionData) => {
    return sectionData.rm.length + sectionData.pm.length;
  };

  // Process a single section
  const processSingleSection = async (sectionName, sectionData) => {
    setProcessingSections(prev => ({
      ...prev,
      [sectionName]: { status: 'processing', progress: 0 }
    }));

    const totalItems = calculateSectionItems(sectionData);
    let processedItems = 0;

    try {
      // Update progress for individual section
      const updateSectionProgress = (progress, action = '') => {
        setProcessingSections(prev => ({
          ...prev,
          [sectionName]: { 
            status: 'processing', 
            progress,
            action 
          }
        }));
      };

      updateSectionProgress(0, `Starting ${sectionName}...`);

      // Save RM materials
      updateSectionProgress(0, `Updating RM materials for ${sectionName}`);
      
      for (const material of sectionData.rm) {
        const rm_collection = `${sectionName}_rm`;
        const period_collection = `${sectionName}_rm_period_${periodId}`;
        const rmRef = doc(db, rm_collection, material.ID);
        const periodRef = doc(db, period_collection, material.ID);
        
        await updateDoc(rmRef, {
          price: material.Price || 0,
        });
        await updateDoc(periodRef, {
          price: material.Price || 0,
        });

        processedItems++;
        const progress = Math.round((processedItems / totalItems) * 100);
        updateSectionProgress(progress, `Processing RM materials...`);
      }

      // Save PM materials
      updateSectionProgress(processedItems > 0 ? Math.round((processedItems / totalItems) * 100) : 0, `Updating PM materials for ${sectionName}`);

      for (const material of sectionData.pm) {
        const pm_collection = `${sectionName}_pm`;
        const period_collection = `${sectionName}_pm_period_${periodId}`;
        const pmRef = doc(db, pm_collection, material.ID);
        const periodRef = doc(db, period_collection, material.ID);
        
        await updateDoc(pmRef, {
          price: material.Price || 0,
        });
        await updateDoc(periodRef, {
          price: material.Price || 0,
        });

        processedItems++;
        const progress = Math.round((processedItems / totalItems) * 100);
        updateSectionProgress(progress, `Processing PM materials...`);
      }

      // Mark section as completed
      setProcessingSections(prev => ({
        ...prev,
        [sectionName]: { status: 'completed', progress: 100 }
      }));

      // Update main progress
      setImportProgress(prev => ({
        ...prev,
        completedSections: [...prev.completedSections.filter(s => s !== sectionName), sectionName],
        failedSections: prev.failedSections.filter(f => f.section !== sectionName)
      }));

    } catch (sectionError) {
      console.error(`Error processing section ${sectionName}:`, sectionError);
      setProcessingSections(prev => ({
        ...prev,
        [sectionName]: { status: 'failed', progress: 0, error: sectionError.message }
      }));

      setImportProgress(prev => ({
        ...prev,
        failedSections: [...prev.failedSections.filter(f => f.section !== sectionName), { 
          section: sectionName, 
          error: sectionError.message 
        }]
      }));
    }
  };

  // Retry failed section
  const retrySection = async (sectionName) => {
    if (!importData || !importData[sectionName]) return;
    await processSingleSection(sectionName, importData[sectionName]);
  };

  // Process imported data and save to Firebase
  const processImportedData = async () => {
    if (!importData) {
      setError("No data to process");
      return;
    }

    setImportLoading(true);
    setError(null);
    setSuccessMessage(null);

    const totalItems = calculateTotalItems(importData);
    let processedItems = 0;

    try {
      // Reset progress
      setImportProgress({
        currentSection: '',
        completedSections: [],
        failedSections: [],
        currentAction: 'Starting import process...',
        processedItems: 0,
        totalItems
      });

      // Reset individual section states
      const initialSectionStates = {};
      Object.keys(importData).forEach(sectionName => {
        initialSectionStates[sectionName] = { status: 'pending', progress: 0 };
      });
      setProcessingSections(initialSectionStates);

      // Save each section's data to Firebase
      for (const [sectionName, data] of Object.entries(importData)) {
        setImportProgress(prev => ({
          ...prev,
          currentSection: sectionName,
          currentAction: `Processing ${sectionName}...`
        }));

        try {
          // Save RM materials
          setImportProgress(prev => ({
            ...prev,
            currentAction: `Updating RM materials for ${sectionName}`
          }));

          for (const material of data.rm) {
            const rm_collection = `${sectionName}_rm`;
            const period_collection = `${sectionName}_rm_period_${periodId}`;
            const rmRef = doc(db, rm_collection, material.ID);
            const periodRef = doc(db, period_collection, material.ID);
            
            await updateDoc(rmRef, {
              price: material.Price || 0,
            });
            await updateDoc(periodRef, {
              price: material.Price || 0,
            });

            processedItems++;
            setImportProgress(prev => ({
              ...prev,
              processedItems
            }));
          }

          // Save PM materials
          setImportProgress(prev => ({
            ...prev,
            currentAction: `Updating PM materials for ${sectionName}`
          }));

          for (const material of data.pm) {
            const pm_collection = `${sectionName}_pm`;
            const period_collection = `${sectionName}_pm_period_${periodId}`;
            const pmRef = doc(db, pm_collection, material.ID);
            const periodRef = doc(db, period_collection, material.ID);
            
            await updateDoc(pmRef, {
              price: material.Price || 0,
            });
            await updateDoc(periodRef, {
              price: material.Price || 0,
            });

            processedItems++;
            setImportProgress(prev => ({
              ...prev,
              processedItems
            }));
          }

          // Mark section as completed
          setImportProgress(prev => ({
            ...prev,
            completedSections: [...prev.completedSections, sectionName]
          }));

          // Update individual section state
          setProcessingSections(prev => ({
            ...prev,
            [sectionName]: { status: 'completed', progress: 100 }
          }));

        } catch (sectionError) {
          console.error(`Error processing section ${sectionName}:`, sectionError);
          setImportProgress(prev => ({
            ...prev,
            failedSections: [...prev.failedSections, { section: sectionName, error: sectionError.message }]
          }));

          // Update individual section state
          setProcessingSections(prev => ({
            ...prev,
            [sectionName]: { status: 'failed', progress: 0, error: sectionError.message }
          }));
        }
      }

      setImportProgress(prev => ({
        ...prev,
        currentSection: '',
        currentAction: 'Import completed successfully!'
      }));

      setSuccessMessage(`Successfully imported data from ${Object.keys(importData).length} sections`);
      setImportData(null);
      setImportFile(null);

    } catch (err) {
      setError("Error processing imported data: " + err.message);
      console.error(err);
    } finally {
      setImportLoading(false);
    }
  };

  // Progress percentage calculation
  const progressPercentage = importProgress.totalItems > 0 
    ? Math.round((importProgress.processedItems / importProgress.totalItems) * 100)
    : 0;

  return (
    <div className="h-[calc(100vh-65px)] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Import Products & Materials
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Import data from Excel files to database
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
            <div className="flex items-center text-red-700 dark:text-red-400">
              <FaExclamationTriangle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors duration-300">
            <div className="flex items-center text-green-700 dark:text-green-400">
              <FaCheck className="w-5 h-5 mr-2" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Progress Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300 h-full">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                Import Progress
              </h2>

              {/* Overall Progress Bar */}
              {importLoading && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Overall Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {importProgress.processedItems} of {importProgress.totalItems} items processed
                  </div>
                </div>
              )}

              {/* Current Action */}
              {importProgress.currentAction && (
                <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center text-blue-700 dark:text-blue-400">
                    <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                    <span className="text-sm font-medium">{importProgress.currentAction}</span>
                  </div>
                </div>
              )}

              {/* Current Section */}
              {importProgress.currentSection && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-yellow-700 dark:text-yellow-400 text-sm">
                    <span className="font-medium">Current Section:</span> {importProgress.currentSection}
                  </div>
                </div>
              )}

              {/* Individual Section Progress */}
              {importData && Object.keys(processingSections).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Section-wise Progress
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {Object.entries(processingSections).map(([sectionName, sectionState]) => (
                      <div key={sectionName} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {sectionName}
                          </span>
                          <div className="flex items-center gap-2">
                            {sectionState.status === 'processing' && (
                              <FaSpinner className="w-3 h-3 text-blue-500 animate-spin" />
                            )}
                            {sectionState.status === 'completed' && (
                              <FaCheck className="w-3 h-3 text-green-500" />
                            )}
                            {sectionState.status === 'failed' && (
                              <FaExclamationTriangle className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`text-xs px-2 py-1 rounded ${
                              sectionState.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              sectionState.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              sectionState.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {sectionState.status}
                            </span>
                          </div>
                        </div>
                        
                        {sectionState.status === 'processing' && (
                          <>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${sectionState.progress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{sectionState.progress}%</span>
                              <span>{sectionState.action}</span>
                            </div>
                          </>
                        )}

                        {sectionState.status === 'failed' && (
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {sectionState.error}
                            </span>
                            <button
                              onClick={() => retrySection(sectionName)}
                              className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                              <FaRedo className="inline w-3 h-3 mr-1" />
                              Retry
                            </button>
                          </div>
                        )}

                        {sectionState.status === 'pending' && (
                          <button
                            onClick={() => processSingleSection(sectionName, importData[sectionName])}
                            disabled={importLoading}
                            className="w-full mt-2 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                          >
                            Process This Section
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Sections */}
              {importProgress.completedSections.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Completed Sections ({importProgress.completedSections.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {importProgress.completedSections.map((section, index) => (
                      <div key={index} className="flex items-center text-green-600 dark:text-green-400 text-sm">
                        <FaCheck className="w-3 h-3 mr-2" />
                        <span>{section}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Sections */}
              {importProgress.failedSections.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                    Failed Sections ({importProgress.failedSections.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {importProgress.failedSections.map((failed, index) => (
                      <div key={index} className="text-red-600 dark:text-red-400 text-sm">
                        <div className="flex items-center">
                          <FaExclamationTriangle className="w-3 h-3 mr-2" />
                          <span className="font-medium">{failed.section}</span>
                        </div>
                        <div className="text-xs mt-1 ml-5 opacity-75">{failed.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Summary */}
              {!importLoading && importProgress.totalItems > 0 && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Total Processed:</span>
                      <span className="font-medium">{importProgress.processedItems} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful Sections:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {importProgress.completedSections.length}
                      </span>
                    </div>
                    {importProgress.failedSections.length > 0 && (
                      <div className="flex justify-between">
                        <span>Failed Sections:</span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {importProgress.failedSections.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Import Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Import Data
                </h2>
                <FaUpload className="text-green-500 text-xl" />
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Excel File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileImport}
                    disabled={importLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                  />
                </div>

                {importFile && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-400 text-sm">
                      Selected file:{" "}
                      <span className="font-medium">{importFile.name}</span>
                    </p>
                  </div>
                )}

                {importData && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Imported Data Preview:
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
                      {Object.entries(importData).map(([sectionName, data]) => (
                        <div
                          key={sectionName}
                          className="border-l-4 border-blue-500 pl-3"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-base">{sectionName}:</p>
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs">
                                  Products: {data.products.length}
                                </span>
                                <span className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs">
                                  RM: {data.rm.length}
                                </span>
                                <span className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-xs">
                                  PM: {data.pm.length}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => processSingleSection(sectionName, data)}
                              disabled={importLoading || processingSections[sectionName]?.status === 'processing'}
                              className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                            >
                              {processingSections[sectionName]?.status === 'processing' ? (
                                <FaSpinner className="inline w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <FaUpload className="inline w-3 h-3 mr-1" />
                              )}
                              Process
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={processImportedData}
                  disabled={importLoading || !importData}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaUpload className="text-lg" />
                  )}
                  {importLoading ? "Processing All Sections..." : "Import All Sections"}
                </button>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-sm text-yellow-700 dark:text-yellow-400">
                  <p className="font-semibold mb-2">Import Requirements:</p>
                  <ul className="space-y-1">
                    <li>• Excel file with multiple sheets (one per section)</li>
                    <li>
                      • Each sheet should have columns: Type, ID, Name, Price, Unit
                    </li>
                    <li>
                      • Type: TV (products), RM (raw materials), PM (packaging)
                    </li>
                    <li>• Price: Only for TV products</li>
                    <li>• Unit: Only for RM/PM materials</li>
                    <li>• All data will be validated before import</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-600 dark:text-gray-400">
                Loading sections...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}