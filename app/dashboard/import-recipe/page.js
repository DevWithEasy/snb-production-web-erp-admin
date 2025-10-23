'use client'
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportRecipe() {
  const [materialStart, setMaterialStart] = useState('');
  const [materialEnd, setMaterialEnd] = useState('');
  const [packagingStart, setPackagingStart] = useState('');
  const [packagingEnd, setPackagingEnd] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [loading, setLoading] = useState(false);

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
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet name
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setExcelData(jsonData);
        
        console.log('Excel Data:', jsonData);
        alert('Excel file read successfully! Check console for data.');
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Error reading Excel file. Please make sure it\'s a valid Excel file.');
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('File reading error:', error);
      alert('Error reading file.');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!materialStart || !materialEnd || !packagingStart || !packagingEnd) {
      alert('Please fill all column numbers');
      return;
    }
    
    if (!excelData) {
      alert('Please select an Excel file first');
      return;
    }

    // Process the data with column numbers
    const processedData = {
      materialRange: {
        start: parseInt(materialStart),
        end: parseInt(materialEnd)
      },
      packagingRange: {
        start: parseInt(packagingStart),
        end: parseInt(packagingEnd)
      },
      excelData: excelData
    };

    console.log('Processed Data:', processedData);
    alert('Data processed successfully! Check console for details.');
    
    // Here you can send the data to your backend or process further
    // processRecipeData(processedData);
  };

  // Reset form
  const handleReset = () => {
    setMaterialStart('');
    setMaterialEnd('');
    setPackagingStart('');
    setPackagingEnd('');
    setExcelFile(null);
    setExcelData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Import Recipe from Excel
          </h1>
          <p className="text-gray-600">
            Upload your Excel file and specify column ranges for materials and packaging
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Column Range Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Materials Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  📦 Materials Columns
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Column Number
                    </label>
                    <input
                      type="number"
                      value={materialStart}
                      onChange={(e) => setMaterialStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="e.g., 1"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Column Number
                    </label>
                    <input
                      type="number"
                      value={materialEnd}
                      onChange={(e) => setMaterialEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="e.g., 10"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Packaging Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  🎁 Packaging Columns
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Column Number
                    </label>
                    <input
                      type="number"
                      value={packagingStart}
                      onChange={(e) => setPackagingStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="e.g., 11"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Column Number
                    </label>
                    <input
                      type="number"
                      value={packagingEnd}
                      onChange={(e) => setPackagingEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="e.g., 15"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                📄 Excel File Upload
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-file"
                />
                
                <label
                  htmlFor="excel-file"
                  className="cursor-pointer block"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        {excelFile ? excelFile.name : 'Choose Excel File'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {excelFile ? 'File selected' : 'Click to upload .xlsx or .xls file'}
                      </p>
                    </div>
                    
                    {!excelFile && (
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Browse Files
                      </button>
                    )}
                  </div>
                </label>
              </div>

              {loading && (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Reading Excel file...</span>
                </div>
              )}

              {excelData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Excel file loaded successfully!</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">
                    Rows: {excelData.length} | Columns: {excelData[0]?.length || 0}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || !excelData}
                className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Import Recipe'}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 px-6 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            💡 How to use:
          </h3>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li>• Specify the column range for Raw Materials (e.g., columns 1-10)</li>
            <li>• Specify the column range for Packaging Materials (e.g., columns 11-15)</li>
            <li>• Upload your Excel file containing the recipe data</li>
            <li>• Click &quot;Import Recipe&quot; to process the data</li>
            <li>• The system will extract data based on your specified column ranges</li>
          </ul>
        </div>
      </div>
    </div>
  );
}