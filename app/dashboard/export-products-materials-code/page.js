"use client";
import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import React, { useEffect, useState } from "react";
import { FaSearch, FaFileExcel, FaFilePdf, FaDownload, FaFileCode } from "react-icons/fa";
import * as XLSX from 'xlsx';

// Manual PDF creation without jspdf-autotable
const createPDF = (section, products, rmMaterials, pmMaterials) => {
  // Create a simple PDF using basic jsPDF
  const { jsPDF } = require('jspdf');
  const doc = new jsPDF();

  // Set initial position
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 128);
  doc.text(`Products & Materials - ${section}`, 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 20;

  // Products Section
  if (products.length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('PRODUCTS', 20, yPosition);
    yPosition += 10;

    // Table Header
    doc.setFillColor(66, 135, 245);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPosition, 170, 8, 'F');
    doc.text('ID', 25, yPosition + 6);
    doc.text('Product Name', 80, yPosition + 6);
    yPosition += 12;

    // Table Rows
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    products.forEach((product, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(product.id || 'N/A', 25, yPosition);
      doc.text(product.name || 'N/A', 80, yPosition);
      yPosition += 8;

      // Add line separator
      if (index < products.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPosition - 2, 190, yPosition - 2);
        yPosition += 4;
      }
    });

    yPosition += 15;
  }

  // Raw Materials Section
  if (rmMaterials.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('RAW MATERIALS', 20, yPosition);
    yPosition += 10;

    // Table Header
    doc.setFillColor(34, 197, 94);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPosition, 170, 8, 'F');
    doc.text('ID', 25, yPosition + 6);
    doc.text('Material Name', 80, yPosition + 6);
    doc.text('Unit', 150, yPosition + 6);
    yPosition += 12;

    // Table Rows
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    rmMaterials.forEach((material, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(material.id || 'N/A', 25, yPosition);
      doc.text(material.name || 'N/A', 80, yPosition);
      doc.text(material.unit || 'N/A', 150, yPosition);
      yPosition += 8;

      // Add line separator
      if (index < rmMaterials.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPosition - 2, 190, yPosition - 2);
        yPosition += 4;
      }
    });

    yPosition += 15;
  }

  // Packaging Materials Section
  if (pmMaterials.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('PACKAGING MATERIALS', 20, yPosition);
    yPosition += 10;

    // Table Header
    doc.setFillColor(249, 115, 22);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPosition, 170, 8, 'F');
    doc.text('ID', 25, yPosition + 6);
    doc.text('Material Name', 80, yPosition + 6);
    doc.text('Unit', 150, yPosition + 6);
    yPosition += 12;

    // Table Rows
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    pmMaterials.forEach((material, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(material.id || 'N/A', 25, yPosition);
      doc.text(material.name || 'N/A', 80, yPosition);
      doc.text(material.unit || 'N/A', 150, yPosition);
      yPosition += 8;

      // Add line separator
      if (index < pmMaterials.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPosition - 2, 190, yPosition - 2);
        yPosition += 4;
      }
    });
  }

  return doc;
};

export default function ExportProductsMaterialsCode() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("");
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const products_collection_name = `${section}_products`;
  const rm_collection_name = `${section}_rm`;
  const pm_collection_name = `${section}_pm`;

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
        // Set default section if not already set
        if (!section && sortedSections.length > 0) {
          setSection(sortedSections[0].value);
        }
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

    setLoading(true);
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

      setProducts(
        products.map((product) => {
          const { id, name } = product;
          return {
            name,
            id
          };
        })
      );
      setMaterials({
        rm: rmData.map((material) => {
          const { id, name, unit } = material;
          return {
            unit,
            id,
            name
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
      setLoading(false);
    }
  };

  // Export to Excel with multiple sheets
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Products sheet
    const productsSheet = XLSX.utils.json_to_sheet(products);
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");

    // Raw Materials sheet
    const rmSheet = XLSX.utils.json_to_sheet(materials.rm);
    XLSX.utils.book_append_sheet(workbook, rmSheet, "Raw Materials");

    // Packaging Materials sheet
    const pmSheet = XLSX.utils.json_to_sheet(materials.pm);
    XLSX.utils.book_append_sheet(workbook, pmSheet, "Packaging Materials");

    // Generate and download Excel file
    XLSX.writeFile(workbook, `${section}_products_materials.xlsx`);
  };

  // Export to JSON
  const exportToJSON = () => {
    const data = {
      products,
      rm: materials.rm,
      pm: materials.pm
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${section}_products_materials.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PDF (Manual implementation)
  const exportToPDF = () => {
    try {
      const doc = createPDF(section, products, materials.rm, materials.pm);
      doc.save(`${section}_products_materials.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Export Products & Materials
          </h1>
          <p className="text-gray-600">
            Select a section and fetch products with their materials
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Section Select */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Section
              </label>
              <div className="flex">
                <select
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value);
                    setProducts([]);
                    setMaterials({ rm: [], pm: [] });
                  }}
                  className="flex-1 h-12 px-3 border border-gray-300 rounded-l-lg bg-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Choose a section</option>
                  {sections.map((sectionItem) => (
                    <option key={sectionItem.value} value={sectionItem.value}>
                      {sectionItem.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleFind}
                  disabled={loading || !section}
                  className="flex items-center justify-center bg-blue-600 text-white h-12 w-12 border-none rounded-r-lg cursor-pointer text-sm transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Find Products & Materials"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaSearch className="text-base" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
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

        {/* Export Buttons */}
        {(products?.length > 0 || materials.rm?.length > 0 || materials.pm?.length > 0) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Export Data
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={exportToExcel}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <FaFileExcel className="text-lg" />
                Export to Excel
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <FaFilePdf className="text-lg" />
                Export to PDF
              </button>
              <button
                onClick={exportToJSON}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                <FaFileCode className="text-lg" />
                Export to JSON
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {(products?.length > 0 || materials.rm?.length > 0 || materials.pm?.length > 0) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Results
            </h2>

            {/* Products Count */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-blue-600 text-sm font-medium">
                  Products
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {products.length}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-green-600 text-sm font-medium">
                  RM Materials
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {materials.rm.length}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-orange-600 text-sm font-medium">
                  PM Materials
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {materials.pm.length}
                </div>
              </div>
            </div>

            {/* Sample Data Preview */}
            <div className="space-y-4">
              {/* Products Preview */}
              {products.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Products
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-600">
                      {JSON.stringify(products, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* RM Materials Preview */}
              {materials.rm.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    RM Materials
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-600">
                      {JSON.stringify(materials.rm, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* PM Materials Preview */}
              {materials.pm.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    PM Materials
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-600">
                      {JSON.stringify(materials.pm, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-600">Loading data...</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            💡 How to use:
          </h3>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li>• Select a section from the dropdown</li>
            <li>• Click the search button to fetch products and materials</li>
            <li>• Use export buttons to download data in different formats</li>
            <li>• Excel: Three separate sheets for Products, RM, and PM</li>
            <li>• PDF: Professional formatted document with tables</li>
            <li>• JSON: Raw data for programming use</li>
          </ul>
        </div>
      </div>
    </div>
  );
}