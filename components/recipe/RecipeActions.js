'use client';

import { useState } from "react";
import { generateRecipePDF } from "@/utils/generateRecipePDF";
import { generateRecipeExcel } from "@/utils/generateRecipeExcel";
import { FaFileDownload, FaFileExcel, FaFilePdf } from "react-icons/fa";

export default function RecipeActions({ recipeData, section, materialsData }) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  const handleGeneratePDF = async (save) => {
    setGeneratingPdf(true);
    try {
      await generateRecipePDF(recipeData, section, materialsData,save);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF: " + error.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGenerateExcel = async () => {
    setGeneratingExcel(true);
    try {
      await generateRecipeExcel(recipeData, section, materialsData);
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("Failed to generate Excel: " + error.message);
    } finally {
      setGeneratingExcel(false);
    }
  };

  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={handleGenerateExcel}
        disabled={generatingExcel}
        className="flex items-center gap-2 bg-green-600/10 cursor-pointer text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {generatingExcel ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <FaFileExcel color="green"/>
        )}
      </button>

      <button
        onClick={()=>handleGeneratePDF(true)}
        disabled={generatingPdf}
        className="flex items-center gap-2 bg-gray-600/10 cursor-pointer text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {generatingPdf ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <FaFileDownload color="black"/>
        )}
      </button>
      <button
        onClick={()=>handleGeneratePDF(false)}
        disabled={generatingPdf}
        className="flex items-center gap-2 bg-red-600/10 cursor-pointer text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {generatingPdf ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <FaFilePdf color="red"/>
        )}
      </button>
    </div>
  );
}