"use client";
import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import getPeriodPath from "@/utils/getPeriodPath";
import { useEffect, useState } from "react";
import { FaDownload, FaCheck, FaExclamationTriangle } from "react-icons/fa";

export default function ExportProductsMaterials() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // নতুন স্টেট যোগ করুন
  const [updatingSection, setUpdatingSection] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updatedItems, setUpdatedItems] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [updateComplete, setUpdateComplete] = useState(false);
  const [completedSections, setCompletedSections] = useState([]);

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

  // Fetch data for a specific section
  const cleanupSectionData = async (sectionValue) => {
    try {
      setUpdatingSection(sectionValue);
      setUpdateStatus("Starting cleanup process...");
      setUpdatedItems(0);
      setUpdateComplete(false);

      const period = getPeriodPath(user?.current_period);
      const products_collection_name = `${sectionValue}_products_period_${period}`;

      setUpdateStatus("Fetching products from database...");
      const products = await Firebase.getDocuments(products_collection_name);
      
      if (!products || products.length === 0) {
        setUpdateStatus(`No products found in ${sectionValue} section`);
        setTimeout(() => {
          setUpdatingSection(null);
          setUpdateStatus("");
        }, 2000);
        return;
      }

      setTotalItems(products.length);
      setUpdateStatus(`Found ${products.length} products. Starting updates...`);

      // প্রতিটি প্রোডাক্ট আপডেট করুন এবং প্রোগ্রেস আপডেট করুন
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const productName = product.name || product.product_name || product.id;
        setUpdateStatus(`Updating product ${i + 1}/${products.length}: ${productName}`);
        
        try {
          await Firebase.updateDocument(products_collection_name, product.id, {
            batch: Array.from({ length: 31 }, (_, i) => ({
              date: i + 1,
              qty: 0,
            })),
            carton: Array.from({ length: 31 }, (_, i) => ({
              date: i + 1,
              qty: 0,
            })),
            updated_at: new Date().toISOString(),
          });

          setUpdatedItems(i + 1);
          
          // প্রতি ৫টি আপডেটের পর একটু থামুন UI রেসপন্সিভ রাখার জন্য
          if ((i + 1) % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
        } catch (productError) {
          console.error(`Error updating product ${product.id}:`, productError);
          setUpdateStatus(`Error updating product ${productName}. Continuing with next...`);
        }
      }

      const successMessage = `✅ Successfully updated ${products.length} products in ${sectionValue} section`;
      setUpdateStatus(successMessage);
      setUpdateComplete(true);
      
      // সম্পন্ন সেকশনগুলোর লিস্ট আপডেট করুন
      setCompletedSections(prev => [...prev, sectionValue]);
      
      // ৩ সেকেন্ড পর স্টেট রিসেট করুন (কিন্তু কমপ্লিটেড লিস্টে রাখুন)
      setTimeout(() => {
        setUpdatingSection(null);
        setUpdateStatus("");
        setUpdatedItems(0);
        setTotalItems(0);
        setUpdateComplete(false);
      }, 3000);

    } catch (error) {
      console.error(`Error in cleanup process for section ${sectionValue}:`, error);
      setUpdateStatus(`❌ Error: ${error.message || 'Failed to complete cleanup'}`);
      setUpdateComplete(false);
      
      setTimeout(() => {
        setUpdatingSection(null);
        setUpdateStatus("");
        setUpdatedItems(0);
        setTotalItems(0);
      }, 4000);
    }
  };

  // একসাথে সব সেকশন ক্লিনআপ করার ফাংশন
  const cleanupAllSections = async () => {
    if (!sections.length) return;
    
    const confirmed = window.confirm(`Are you sure you want to cleanup all ${sections.length} sections? This will reset batch and carton data for all products.`);
    if (!confirmed) return;

    for (const section of sections) {
      await cleanupSectionData(section.value);
      // প্রতিটি সেকশনের পর ১ সেকেন্ড অপেক্ষা করুন
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Data Cleanup Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Reset batch and carton quantities to zero for all products
          </p>
        </div>

        {/* আপডেট স্ট্যাটাস ডিসপ্লে */}
        {updatingSection && (
          <div className={`mb-6 rounded-lg p-5 border transition-all duration-300 ${
            updateComplete 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                {updateComplete ? (
                  <FaCheck className="w-6 h-6 text-green-500 dark:text-green-400" />
                ) : (
                  <div className="w-6 h-6 border-3 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className={`font-bold text-lg ${
                      updateComplete 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-blue-700 dark:text-blue-400'
                    }`}>
                      {updateComplete ? '✓ Complete' : '🔄 Processing'}
                      <span className="ml-2 font-semibold">{updatingSection}</span>
                    </h3>
                    <p className={`text-sm mt-1 ${
                      updateComplete 
                        ? 'text-green-600 dark:text-green-300' 
                        : 'text-blue-600 dark:text-blue-300'
                    }`}>
                      {updateStatus}
                    </p>
                  </div>
                  {totalItems > 0 && (
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        updateComplete 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {updatedItems}/{totalItems}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Products Updated
                      </div>
                    </div>
                  )}
                </div>
                
                {totalItems > 0 && !updateComplete && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((updatedItems / totalItems) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          updateComplete 
                            ? 'bg-green-500 dark:bg-green-400' 
                            : 'bg-blue-500 dark:bg-blue-400'
                        }`}
                        style={{ width: `${(updatedItems / totalItems) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
            <div className="flex items-center text-red-700 dark:text-red-400">
              <FaExclamationTriangle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* কমপ্লিটেড সেকশনস */}
        {completedSections.length > 0 && (
          <div className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                Recently Cleaned Sections
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completedSections.length} section(s)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {completedSections.map((section, index) => (
                <div 
                  key={index}
                  className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  <FaCheck className="w-3 h-3" />
                  {section}
                </div>
              ))}
            </div>
            {completedSections.length > 5 && (
              <button 
                onClick={() => setCompletedSections([])}
                className="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear history
              </button>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Section Cleanup
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Select a section to reset product quantities
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchSections}
                disabled={loading || updatingSection !== null}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refresh Sections
              </button>
              {sections.length > 0 && (
                <button
                  onClick={cleanupAllSections}
                  disabled={loading || updatingSection !== null}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FaExclamationTriangle className="w-3.5 h-3.5" />
                  Cleanup All Sections
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Available Sections
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({sections.length} sections found)
                  </span>
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Click any section to start cleanup
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                {sections.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sections.map((sectionItem) => {
                      const isUpdating = updatingSection === sectionItem.value;
                      const isCompleted = completedSections.includes(sectionItem.value);
                      
                      return (
                        <button
                          key={sectionItem.value}
                          onClick={() => cleanupSectionData(sectionItem.value)}
                          disabled={updatingSection !== null && !isUpdating}
                          className={`
                            relative rounded-xl p-4 text-center border-2 transition-all duration-300
                            ${isUpdating 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-[1.02]' 
                              : isCompleted
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                            }
                            ${(updatingSection !== null && !isUpdating) 
                              ? 'opacity-40 cursor-not-allowed' 
                              : 'hover:scale-[1.02] active:scale-[0.98]'
                            }
                          `}
                        >
                          {isCompleted && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                              <FaCheck className="w-3 h-3" />
                            </div>
                          )}
                          
                          <div className="flex flex-col items-center">
                            <span className={`
                              text-base font-semibold mb-1
                              ${isUpdating 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : isCompleted
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-700 dark:text-gray-300'
                              }
                            `}>
                              {sectionItem.label}
                            </span>
                            
                            <span className={`
                              text-xs font-medium px-2 py-1 rounded-full
                              ${isUpdating 
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                                : isCompleted
                                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }
                            `}>
                              {sectionItem.value}
                            </span>
                            
                            {isUpdating && (
                              <div className="mt-3 flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-blue-600 dark:text-blue-400 animate-pulse">
                                  Updating...
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                      <FaExclamationTriangle className="w-full h-full" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                      No sections available
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Try refreshing or check your database connection
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Information Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <FaDownload className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2">
                    About Data Cleanup
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>Resets <strong>batch</strong> and <strong>carton</strong> quantities to zero for all 31 days</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>Only affects products in the selected section&apos;s current period</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>Each product&apos;s update timestamp will be recorded</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">Warning: This action cannot be undone!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Loading sections...
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Fetching data from database
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>
            Current Period: <span className="font-semibold">{getPeriodPath(user?.current_period) || 'Not set'}</span> • 
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}