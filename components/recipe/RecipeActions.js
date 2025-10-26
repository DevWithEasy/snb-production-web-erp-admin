'use client';

import { useState } from "react";
import { generateRecipePDF } from "@/utils/generateRecipePDF";
import { generateRecipeExcel } from "@/utils/generateRecipeExcel";

export default function RecipeActions({ recipeData, section, materialsData }) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  const handleGeneratePDF = async () => {
    setGeneratingPdf(true);
    try {
      await generateRecipePDF(recipeData, section, materialsData);
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
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {generatingExcel ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {generatingExcel ? "Generating..." : "Excel"}
      </button>

      <button
        onClick={handleGeneratePDF}
        disabled={generatingPdf}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {generatingPdf ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {generatingPdf ? "Generating..." : "PDF"}
      </button>
    </div>
  );
}