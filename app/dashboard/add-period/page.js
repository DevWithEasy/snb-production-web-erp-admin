"use client";
import { useState, useEffect } from "react";
import Firebase from "@/utils/firebase";
import { db } from "@/utils/firebaseConfig";
import { collection, doc, updateDoc, getDocs, deleteDoc } from "firebase/firestore";
import { arrayUnion, arrayRemove } from "firebase/firestore";

export default function AddPeriods() {
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("january");
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyCollection, setCopyCollection] = useState("");
  const [item, setItem] = useState("");
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    section: "",
    collection: ""
  });

  const months = [
    { label: "January", value: "january" },
    { label: "February", value: "february" },
    { label: "March", value: "march" },
    { label: "April", value: "april" },
    { label: "May", value: "may" },
    { label: "June", value: "june" },
    { label: "July", value: "july" },
    { label: "August", value: "august" },
    { label: "September", value: "september" },
    { label: "October", value: "october" },
    { label: "November", value: "november" },
    { label: "December", value: "december" },
  ];

  const years = [
    { label: "2025", value: "2025" },
    { label: "2026", value: "2026" },
    { label: "2027", value: "2027" },
    { label: "2028", value: "2028" },
    { label: "2029", value: "2029" },
    { label: "2030", value: "2030" },
  ];

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

  const handleSubmit = async () => {
    const monthMap = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };
    
    const inputMonthNum = monthMap[month.toLowerCase()];
    const inputYearNum = parseInt(year);
    const cutoffMonthNum = 9;
    const cutoffYearNum = 2025;
    
    if (
      inputYearNum < cutoffYearNum ||
      (inputYearNum === cutoffYearNum && inputMonthNum < cutoffMonthNum)
    ) {
      alert("You cannot submit data for any month before September 2025.");
      return;
    }
    
    const period = `${month}_${year}`;
    if (!sections.length) {
      alert("Sections are not loaded yet.");
      return;
    }

    if (!window.confirm(`Are you sure you want to create period ${month} ${year}? This will copy all data from base collections.`)) {
      return;
    }

    const collections = ["products", "rm", "pm"];

    setCopying(true);
    setCopyCollection("Starting copy process...");
    setItem("");
    setProgress({ current: 0, total: 0, section: "", collection: "" });

    try {
      let totalOperations = 0;
      let completedOperations = 0;

      // Calculate total operations for progress
      for (const coll of collections) {
        for (const section of sections) {
          const collectionName = `${section.value}_${coll}`;
          try {
            const docs = await Firebase.getDocuments(collectionName);
            if (docs && docs.length > 0) {
              totalOperations += docs.length;
            }
          } catch (error) {
            console.error(`Error counting docs for ${collectionName}:`, error);
          }
        }
      }

      setProgress(prev => ({ ...prev, total: totalOperations }));

      for (const coll of collections) {
        for (const section of sections) {
          const collectionName = `${section.value}_${coll}`;
          const targetCollectionName = `${section.value}_${coll}_period_${period}`;
          
          setCopyCollection(`📂 Copying: ${section.label} - ${coll}`);
          
          try {
            const docs = await Firebase.getDocuments(collectionName);
            if (!docs || docs.length === 0) {
              console.warn(`No docs found for ${collectionName}`);
              continue;
            }

            setProgress(prev => ({ 
              ...prev, 
              section: section.label, 
              collection: coll 
            }));

            for (let i = 0; i < docs.length; i++) {
              const doc = docs[i];
              completedOperations++;
              
              setItem(`📄 (${i + 1}/${docs.length}) - ${doc.name || doc.id}`);
              setProgress(prev => ({ 
                ...prev, 
                current: completedOperations 
              }));

              const { id, ...gen_doc } = doc;
              await Firebase.createDocWithName(
                targetCollectionName,
                id,
                gen_doc
              );

              // Small delay to allow UI to update
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          } catch (error) {
            console.error(`❌ Error copying ${section.value} ${coll}:`, error);
            setItem(`❌ Error copying ${section.label} - ${coll}: ${error.message}`);
          }
        }
      }

      // Update user periods
      setCopyCollection("🔄 Updating user periods...");
      setItem("");
      
      const upperCaseMonth = month.charAt(0).toUpperCase() + month.slice(1);
      const user_period = `${upperCaseMonth}, ${year}`;
      const users = await Firebase.getDocuments("users");
      
      for (const user of users) {
        const userDocRef = doc(db, "users", user.id);
        await updateDoc(userDocRef, {
          periods: arrayUnion(user_period),
        });
      }

      setCopyCollection("✅ Copy process completed successfully!");
      setItem(`Total: ${totalOperations} documents processed`);
      
      setTimeout(() => {
        setCopying(false);
        setCopyCollection("");
        setItem("");
        setProgress({ current: 0, total: 0, section: "", collection: "" });
      }, 3000);

    } catch (error) {
      console.error("Copy Error:", error);
      setCopyCollection("❌ Error during copy process");
      setItem(error.message);
      setCopying(false);
    }
  };

  async function deletePeriod() {
    const period = `${month}_${year}`;
    
    if (!window.confirm(`Are you sure you want to DELETE period ${month} ${year}? This action cannot be undone and will remove all data for this period.`)) {
      return;
    }

    try {
      const collections = ["products", "rm", "pm"];

      setCopying(true);
      setCopyCollection("Starting delete process...");
      setItem("");

      let totalDeleted = 0;

      for (const collectionName of collections) {
        for (const section of sections) {
          const baseName = `${section.value}_${collectionName}_period_${period}`;
          setCopyCollection(`🗑️ Deleting: ${section.label} - ${collectionName}`);
          
          console.log(`🧹 Deleting all docs from ${baseName}...`);

          try {
            const colRef = collection(db, baseName);
            const snapshot = await getDocs(colRef);

            if (snapshot.empty) {
              console.warn(`⚠️ No docs found in ${baseName}`);
              setItem(`No documents found in ${baseName}`);
              continue;
            }

            setItem(`Deleting ${snapshot.docs.length} documents...`);
            const deletePromises = snapshot.docs.map((d) =>
              deleteDoc(doc(db, baseName, d.id))
            );

            await Promise.all(deletePromises);
            totalDeleted += snapshot.docs.length;
            setItem(`✅ Deleted ${snapshot.docs.length} documents from ${baseName}`);
            console.log(`✅ Deleted all docs from ${baseName}`);
            
            // Small delay for UI update
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`❌ Error deleting from ${baseName}:`, error);
            setItem(`❌ Error deleting from ${baseName}: ${error.message}`);
          }
        }
      }

      // Remove period from users
      setCopyCollection("🔄 Removing period from users...");
      const upperCaseMonth = month.charAt(0).toUpperCase() + month.slice(1);
      const user_period = `${upperCaseMonth}, ${year}`;
      const users = await Firebase.getDocuments("users");
      
      for (const user of users) {
        const userDocRef = doc(db, "users", user.id);
        await updateDoc(userDocRef, {
          periods: arrayRemove(user_period),
        });
      }

      setCopyCollection(`✅ Delete process completed! Removed ${totalDeleted} documents.`);
      
      setTimeout(() => {
        setCopying(false);
        setCopyCollection("");
        setItem("");
      }, 3000);
      
      console.log("🎉 All period collections cleared successfully!");
    } catch (error) {
      console.error("🔥 Unexpected error in deletePeriod():", error);
      setCopyCollection("❌ Error during delete process");
      setItem(error.message);
      setCopying(false);
    }
  }

  if (loadingSections) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-600 dark:text-gray-400">Loading sections...</div>
      </div>
    );
  }

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Manage Periods</h1>
        
        {/* Progress Indicator */}
        {copying && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500 dark:border-blue-400 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Processing Data</h3>
            </div>
            
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{copyCollection}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">{item}</div>
            
            {progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress: {progress.current}/{progress.total} 
                    {progress.section && ` - ${progress.section}`}
                    {progress.collection && ` (${progress.collection})`}
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Month and Year Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Month Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              >
                {months.map((monthItem) => (
                  <option key={monthItem.value} value={monthItem.value}>
                    {monthItem.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              >
                {years.map((yearItem) => (
                  <option key={yearItem.value} value={yearItem.value}>
                    {yearItem.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Period Summary */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-300">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Selected Period:</h3>
            <p className="text-blue-700 dark:text-blue-400 capitalize">
              {month} {year}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Format: {month}_{year}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={copying}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
              copying 
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" 
                : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            }`}
          >
            {copying ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Copying...
              </div>
            ) : (
              "Create Period"
            )}
          </button>

          <button
            onClick={deletePeriod}
            disabled={copying}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
              copying 
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed" 
                : "bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            }`}
          >
            {copying ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              "Delete Period"
            )}
          </button>
        </div>

        {/* Information Box */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">How it works:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <span className="font-medium">Create Period:</span> Copies all products, RM, and PM data to new period collections</li>
            <li>• <span className="font-medium">Delete Period:</span> Removes all data for the selected period</li>
            <li>• <span className="font-medium">Data Safety:</span> Cannot create periods before September 2025</li>
            <li>• <span className="font-medium">User Access:</span> Automatically updates period list for all users</li>
          </ul>
        </div>
      </div>
    </div>
  );
}