"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Firebase from "@/utils/firebase";
import { db } from "@/utils/firebaseConfig";
import getPeriodPath from "@/utils/getPeriodPath";
import ServerLoading from "@/components/ServerLoading";
import { collection, doc, updateDoc, getDocs } from "firebase/firestore";

export default function PeriodOpeningCopy() {
  const { user } = useAuth();
  const [copyFrom, setCopyFrom] = useState("");
  const [copyTo, setCopyTo] = useState("");
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("");
  const [copying, setCopying] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoadingSections(true);
        const sectionsData = await Firebase.getDocuments("sections");
        setSections(sectionsData || []);
      } catch (error) {
        console.error("Error fetching sections:", error);
        alert("Error loading sections");
      } finally {
        setLoadingSections(false);
      }
    };
    
    fetchSections();
  }, []);

  function parseMonthYear(str) {
    const [month, year] = str.split("_");
    const monthNames = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11,
    };

    return new Date(parseInt(year), monthNames[month.toLowerCase()]);
  }

  const handleSubmit = async () => {
    if (section === "") {
      return alert("Please select Section to copy consumption!");
    }
    if (copyFrom === "" || copyTo === "") {
      return alert("Please select From ⇒ To period to copy consumption!");
    }
    if (copyFrom === copyTo) {
      return alert("Please select different period From ⇒ To period to copy consumption!");
    }

    const fromMonth = parseMonthYear(copyFrom);
    const toMonth = parseMonthYear(copyTo);

    if (fromMonth > toMonth) {
      return alert("Please select Higher period From ⇒ To period to copy consumption!");
    }

    if (!window.confirm(`Are you sure you want to copy opening from ${copyFrom} to ${copyTo} for ${section} section?`)) {
      return;
    }

    setCopying(true);
    try {
      const fields = ["rm", "pm"];
      
      for (const field of fields) {
        const fromCollectionName = `${section}_${field}_period_${copyFrom}`;
        const toCollectionName = `${section}_${field}_period_${copyTo}`;

        try {
          const materials = await Firebase.getDocuments(fromCollectionName);
          
          for (const material of materials) {
            const docSnap = await Firebase.getDocument(toCollectionName, material.id);
            if (docSnap.exists) {
              const docRef = doc(db, toCollectionName, material.id);
              await updateDoc(docRef, {
                opening: material.closing || 0,
              });
            }
          }
        } catch (error) {
          console.error(`Error processing ${field}:`, error);
        }
      }
      
      alert("Success: Opening balances copied successfully!");
      setCopying(false);
    } catch (error) {
      setCopying(false);
      console.error("Copy operation failed:", error);
      alert("Error: Failed to copy opening balances");
    }
  };

  if (loadingSections) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-600">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ServerLoading visible={copying} message={`Closing ⇒ Opening Copying From ${copyFrom} ⇒ ${copyTo}`} />
      
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Copy Opening Balances</h1>
        
        {/* Section Select */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section
          </label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select Section</option>
            {sections.map((sectionItem) => (
              <option key={sectionItem.value} value={sectionItem.value}>
                {sectionItem.label}
              </option>
            ))}
          </select>
        </div>

        {/* Copy From Select */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Copy From
          </label>
          <select
            value={copyFrom}
            onChange={(e) => setCopyFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select From Period</option>
            {user?.periods
              ?.filter((p) => getPeriodPath(p) !== copyTo)
              .map((period) => (
                <option key={period} value={getPeriodPath(period)}>
                  {period}
                </option>
              ))}
          </select>
        </div>

        {/* Copy To Select */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Copy To
          </label>
          <select
            value={copyTo}
            onChange={(e) => setCopyTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select To Period</option>
            {user?.periods
              ?.filter((p) => getPeriodPath(p) !== copyFrom)
              .map((period) => (
                <option key={period} value={getPeriodPath(period)}>
                  {period}
                </option>
              ))}
          </select>
        </div>

        {/* Summary */}
        {section !== "" && copyFrom !== "" && copyTo !== "" && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Operation Summary:</h3>
            <p className="text-blue-700">
              <span className="font-medium">Section:</span> {section}
            </p>
            <p className="text-blue-700">
              <span className="font-medium">Period:</span> {copyFrom} ⇒ {copyTo}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              This will copy closing balances from {copyFrom} to opening balances of {copyTo}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={copying}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
            copying 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}
        >
          {copying ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Copying...
            </div>
          ) : (
            "Copy Opening Balances"
          )}
        </button>

        {/* Information Box */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">How it works:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Copies closing balances from source period to opening balances of target period</li>
            <li>• Affects both Raw Materials (RM) and Packaging Materials (PM)</li>
            <li>• Only copies materials that exist in both periods</li>
            <li>• This operation cannot be undone</li>
          </ul>
        </div>
      </div>
    </div>
  );
}