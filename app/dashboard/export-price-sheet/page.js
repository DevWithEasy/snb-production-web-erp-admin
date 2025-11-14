"use client";
import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import { useEffect, useState } from "react";
import { FaDownload, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function ExportProductsMaterials() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);

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
  const fetchSectionData = async (sectionValue) => {
    try {
      const products_collection_name = `${sectionValue}_products`;
      const rm_collection_name = `${sectionValue}_rm`;
      const pm_collection_name = `${sectionValue}_pm`;

      const [products, rmData, pmData] = await Promise.all([
        Firebase.getDocuments(products_collection_name),
        Firebase.getDocuments(rm_collection_name),
        Firebase.getDocuments(pm_collection_name),
      ]);

      return {
        section: sectionValue,
        products: products || [],
        rm: rmData || [],
        pm: pmData || [],
      };
    } catch (error) {
      console.error(`Error fetching data for section ${sectionValue}:`, error);
      return {
        section: sectionValue,
        products: [],
        rm: [],
        pm: [],
      };
    }
  };

  // Export all sections to Excel with multiple sheets
  const exportAllSectionsToExcel = async () => {
    if (!sections.length) {
      setError("No sections available for export");
      return;
    }

    setExportLoading(true);
    setError(null);

    try {
      const workbook = XLSX.utils.book_new();

      // Fetch data for all sections
      const sectionDataPromises = sections.map(section => 
        fetchSectionData(section.value)
      );
      const allSectionData = await Promise.all(sectionDataPromises);

      // Create a sheet for each section
      for (const sectionData of allSectionData) {
        const { section, products, rm, pm } = sectionData;
        
        // Prepare data for this section's sheet
        const sheetData = [];
        
        // Add Product Products first
        // products.sort((a,b)=>a.name.localeCompare(b.name)).forEach(product => {
        //   sheetData.push({
        //     Type: "PRODUCT",
        //     ID: product.id,
        //     Name: product.name,
        //     Unit: "",
        //     Price: product.price || "",
        //   });
        // });

        // Add RM Materials
        rm.sort((a,b)=>a.name.localeCompare(b.name)).forEach(material => {
          sheetData.push({
            Type: "RM",
            ID: material.id,
            Name: material.name,
            Unit: material.unit || "",
            Price: "",
          });
        });

        // Add PM Materials
        pm.sort((a,b)=>a.name.localeCompare(b.name)).forEach(material => {
          sheetData.push({
            Type: "PM",
            ID: material.id,
            Name: material.name,
            Unit: material.unit || "",
            Price: "",
          });
        });

        // Create worksheet and add to workbook
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, section);
      }

      // Generate and download Excel file
      XLSX.writeFile(workbook, `all_sections_products_materials.xlsx`);
      
    } catch (err) {
      setError("Error exporting data: " + err.message);
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Export Products & Materials
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Export all sections data to Excel file
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
            <div className="flex items-center text-red-700 dark:text-red-400">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Export Data
            </h2>
            <FaDownload className="text-blue-500 text-xl" />
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                Available Sections ({sections.length})
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                {sections.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {sections.map((sectionItem) => (
                      <div
                        key={sectionItem.value}
                        className="bg-white dark:bg-gray-600 rounded p-3 text-center border border-gray-200 dark:border-gray-500"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {sectionItem.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No sections found
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={exportAllSectionsToExcel}
              disabled={exportLoading || !sections.length}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 dark:bg-green-700 text-white font-semibold rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FaFileExcel className="text-lg" />
              )}
              {exportLoading ? "Exporting..." : "Export All Sections to Excel"}
            </button>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-400">
              <p className="font-semibold mb-2">Export Format:</p>
              <ul className="space-y-1">
                <li>• Each section becomes a separate Excel tab</li>
                <li>• TV products listed first in each tab</li>
                <li>• RM materials added after products</li>
                <li>• PM materials added last</li>
                <li>• Price column included for products</li>
                <li>• All data sorted alphabetically by name</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-600 dark:text-gray-400">Loading sections...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}