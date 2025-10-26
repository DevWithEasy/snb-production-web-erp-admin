"use client";
import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import LOGO_BASE64 from "@/utils/imageData";
import { useEffect, useState } from "react";
import { FaFileCode, FaFileExcel, FaFilePdf, FaSearch } from "react-icons/fa";
import * as XLSX from "xlsx";
LOGO_BASE64;

// Manual PDF creation without jspdf-autotable
const createPDF = (section, products, rmMaterials, pmMaterials) => {
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF();

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Add footer function
  const addFooter = (pageNumber) => {
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${pageNumber}`, pageWidth - 20, footerY);
    doc.text(`Developed By- Robi App Lab`, 20, footerY);
  };

  // Set initial position
  let yPosition = 5;
  let currentPage = 1;

  // Add logo and header - 20x20 pixels, centered
  if (LOGO_BASE64) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 20;
    const logoX = (pageWidth - logoWidth) / 2; // Center calculation
    doc.addImage(LOGO_BASE64, "PNG", logoX, yPosition, 20, 20);
    yPosition += 25;
  }

  // Company name - Bold
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 6, 6);
  doc.text('S&B Nice Nice Food Valley Ltd.', 105, yPosition, { align: 'center' });
  yPosition += 8;

  // Section info - Normal
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal'); // Normal font weight
  doc.setTextColor(0, 0, 0);
  doc.text(`${section?.charAt(0).toUpperCase() + section?.slice(1)} Section`, 105, yPosition, { align: 'center' });
  yPosition += 6;

  // Date info - Normal
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal'); // Normal font weight
  doc.text(`Product and materials Code`, 105, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 10;

  // Products Section
  if (products.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal'); // Normal font weight for section title
    doc.setTextColor(0, 0, 0);
    doc.text("PRODUCTS", 20, yPosition);
    yPosition += 5;

    // Table Header - Bold
    doc.setFillColor(66, 135, 245);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPosition, 170, 7, "F");
    doc.setFont('helvetica', 'bold'); // Bold for header only
    doc.text("ID", 25, yPosition + 5);
    doc.text("Product Name", 80, yPosition + 5);
    yPosition += 10;

    // Table Rows with striped background - Normal font weight
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal'); // Normal font weight for data rows

    products.forEach((product, index) => {
      if (yPosition > 270) {
        addFooter(currentPage);
        doc.addPage();
        currentPage++;
        yPosition = 20;
      }

      // Alternate row colors - ODD: light gray, EVEN: white
      if (index % 2 === 0) {
        doc.setFillColor(240, 240, 240); // ODD - Light gray
      } else {
        doc.setFillColor(255, 255, 255); // EVEN - White
      }
      doc.rect(20, yPosition - 4, 170, 6, "F");

      // Always black text with normal font weight
      doc.setTextColor(0, 0, 0);
      doc.text(product.id || "N/A", 25, yPosition);
      doc.text(product.name || "N/A", 80, yPosition);
      yPosition += 6;
    });

    yPosition += 8;
  }

  // Raw Materials Section
  if (rmMaterials.length > 0) {
    if (yPosition > 250) {
      addFooter(currentPage);
      doc.addPage();
      currentPage++;
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal'); // Normal font weight for section title
    doc.setTextColor(0, 0, 0);
    doc.text("RAW MATERIALS", 20, yPosition);
    yPosition += 8;

    // Table Header - Bold
    doc.setFillColor(34, 197, 94);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPosition, 170, 7, "F");
    doc.setFont('helvetica', 'bold'); // Bold for header only
    doc.text("ID", 25, yPosition + 5);
    doc.text("Material Name", 80, yPosition + 5);
    doc.text("Unit", 150, yPosition + 5);
    yPosition += 10;

    // Table Rows with striped background - Normal font weight
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal'); // Normal font weight for data rows

    rmMaterials.forEach((material, index) => {
      if (yPosition > 270) {
        addFooter(currentPage);
        doc.addPage();
        currentPage++;
        yPosition = 20;
      }

      // Alternate row colors - ODD: light gray, EVEN: white
      if (index % 2 === 0) {
        doc.setFillColor(240, 240, 240); // ODD - Light gray
      } else {
        doc.setFillColor(255, 255, 255); // EVEN - White
      }
      doc.rect(20, yPosition - 4, 170, 6, "F");

      // Always black text with normal font weight
      doc.setTextColor(0, 0, 0);
      doc.text(material.id || "N/A", 25, yPosition);
      doc.text(material.name || "N/A", 80, yPosition);
      doc.text(material.unit || "N/A", 150, yPosition);
      yPosition += 6;
    });

    yPosition += 8;
  }

  // Packaging Materials Section
  if (pmMaterials.length > 0) {
    if (yPosition > 250) {
      addFooter(currentPage);
      doc.addPage();
      currentPage++;
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal'); // Normal font weight for section title
    doc.setTextColor(0, 0, 0);
    doc.text("PACKAGING MATERIALS", 20, yPosition);
    yPosition += 8;

    // Table Header - Bold
    doc.setFillColor(249, 115, 22);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPosition, 170, 7, "F");
    doc.setFont('helvetica', 'bold'); // Bold for header only
    doc.text("ID", 25, yPosition + 5);
    doc.text("Material Name", 80, yPosition + 5);
    doc.text("Unit", 150, yPosition + 5);
    yPosition += 10;

    // Table Rows with striped background - Normal font weight
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal'); // Normal font weight for data rows

    pmMaterials.forEach((material, index) => {
      if (yPosition > 270) {
        addFooter(currentPage);
        doc.addPage();
        currentPage++;
        yPosition = 20;
      }

      // Alternate row colors - ODD: light gray, EVEN: white
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255); // EVEN - White
      } else {
        doc.setFillColor(240, 240, 240); // ODD - Light gray
      }
      doc.rect(20, yPosition - 4, 170, 6, "F");

      // Always black text with normal font weight
      doc.setTextColor(0, 0, 0);
      doc.text(material.id || "N/A", 25, yPosition);
      doc.text(material.name || "N/A", 80, yPosition);
      doc.text(material.unit || "N/A", 150, yPosition);
      yPosition += 6;
    });
  }

  // Add footer to the last page
  addFooter(currentPage);

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
  
  // Separate search terms for each section
  const [productSearch, setProductSearch] = useState("");
  const [rmSearch, setRmSearch] = useState("");
  const [pmSearch, setPmSearch] = useState("");

  const products_collection_name = `${section}_products`;
  const rm_collection_name = `${section}_rm`;
  const pm_collection_name = `${section}_pm`;

  // Filter data based on separate search terms
  const filteredProducts = products.filter(item =>
    item.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    item.id?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredRmMaterials = materials.rm?.filter(item =>
    item.name?.toLowerCase().includes(rmSearch.toLowerCase()) ||
    item.id?.toLowerCase().includes(rmSearch.toLowerCase())
  ) || [];

  const filteredPmMaterials = materials.pm?.filter(item =>
    item.name?.toLowerCase().includes(pmSearch.toLowerCase()) ||
    item.id?.toLowerCase().includes(pmSearch.toLowerCase())
  ) || [];

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
    // Reset all search terms when fetching new data
    setProductSearch("");
    setRmSearch("");
    setPmSearch("");
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
            id,
          };
        })
      );
      setMaterials({
        rm: rmData.map((material) => {
          const { id, name, unit } = material;
          return {
            name,
            unit,
            id,
          };
        }),
        pm: pmData.map((material) => {
          const { id, name, unit } = material;
          return {
            name,
            unit,
            id,
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

    // Use original data for export (not filtered)
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
      pm: materials.pm,
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
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] bg-gray-50 p-6">
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
                    // Reset all search terms when section changes
                    setProductSearch("");
                    setRmSearch("");
                    setPmSearch("");
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
        {(products?.length > 0 ||
          materials.rm?.length > 0 ||
          materials.pm?.length > 0) && (
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
        {(products?.length > 0 ||
          materials.rm?.length > 0 ||
          materials.pm?.length > 0) && (
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

            {/* Sample Data Preview with Separate Search Inputs */}
            <div className="space-y-6">
              {/* Products Preview with Search */}
              {products.length > 0 && (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-700">
                      Products ({filteredProducts.length} of {products.length})
                    </h3>
                    <div className="relative w-64">
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products by name or ID..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      <pre className="text-sm text-gray-600">
                        {JSON.stringify(filteredProducts, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No products match your search
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RM Materials Preview with Search */}
              {materials.rm.length > 0 && (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="bg-green-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-700">
                      RM Materials ({filteredRmMaterials.length} of {materials.rm.length})
                    </h3>
                    <div className="relative w-64">
                      <input
                        type="text"
                        value={rmSearch}
                        onChange={(e) => setRmSearch(e.target.value)}
                        placeholder="Search RM materials by name or ID..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      />
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 max-h-60 overflow-y-auto">
                    {filteredRmMaterials.length > 0 ? (
                      <pre className="text-sm text-gray-600">
                        {JSON.stringify(filteredRmMaterials, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No RM materials match your search
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PM Materials Preview with Search */}
              {materials.pm.length > 0 && (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="bg-orange-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-700">
                      PM Materials ({filteredPmMaterials.length} of {materials.pm.length})
                    </h3>
                    <div className="relative w-64">
                      <input
                        type="text"
                        value={pmSearch}
                        onChange={(e) => setPmSearch(e.target.value)}
                        placeholder="Search PM materials by name or ID..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 max-h-60 overflow-y-auto">
                    {filteredPmMaterials.length > 0 ? (
                      <pre className="text-sm text-gray-600">
                        {JSON.stringify(filteredPmMaterials, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No PM materials match your search
                      </div>
                    )}
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
            <li>• Use individual search boxes to filter each section</li>
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