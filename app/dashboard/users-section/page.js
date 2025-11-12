"use client";
import Firebase from "@/utils/firebase";
import { db } from "@/utils/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaIndustry, FaWarehouse, FaBuilding, FaSearch } from "react-icons/fa";

export default function UsersSection() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const sectionsData = await Firebase.getDocuments("sections");
        setSections(sectionsData || []);
      } catch (error) {
        console.error("Error fetching sections:", error);
        alert("Failed to load sections");
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  // Filter sections based on search term
  const filteredSections = sections.filter(
    (section) =>
      section.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.value?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Section icons based on section type or name
  const getSectionIcon = (sectionName) => {
    const name = sectionName?.toLowerCase() || "";
    if (name.includes("production") || name.includes("prod")) return FaIndustry;
    if (name.includes("warehouse") || name.includes("store"))
      return FaWarehouse;
    if (name.includes("building") || name.includes("block")) return FaBuilding;
    return FaIndustry; // Default icon
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-600">Loading sections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Sections Management
          </h1>
          <p className="text-gray-600">
            Manage and navigate to different production sections
          </p>
        </div>

        <button
          onClick={async () => {
            console.log("Start Update");
            for (const section of sections) {
              const fields = ["rm", "pm"];
              for (const field of fields) {
                const periods = ["september", "october", "november"];
                for (const period of periods) {
                  const collection_name = `${section.value}_${field}_period_${period}_2025`;
                  console.log(collection_name + " Update Starting");
                  const items = await Firebase.getDocuments(collection_name);
                  for (const item of items) {
                    const docRef = doc(db, collection_name, item.id);
                    await updateDoc(docRef, {
                      price: 0,
                      type: field == 'rm' ? "rm" : item.unit==='pcs' ? 'carton' : 'wrapper',
                    });
                    console.log(item.name + " Updated");
                  }
                }
              }
            }
            console.log("Complete Update");
          }}
        >
          ACTION
        </button>

        {/* Search and Stats Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Total: {sections.length} sections
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Showing: {filteredSections.length} sections
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" size={16} />
              </div>
              <input
                type="text"
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-20">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Available Sections
            </h2>
          </div>

          <div className="p-4 md:p-6">
            {filteredSections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredSections.map((item) => {
                  const IconComponent = getSectionIcon(item.label);
                  return (
                    <Link
                      key={item.id}
                      href={`/section/${item.value}`}
                      className="group block"
                    >
                      <div className="flex flex-row md:flex-col space-x-2 items-center md:space-x-0 bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1 group-hover:bg-blue-50">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                          <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">
                            <IconComponent
                              className="text-blue-600 group-hover:text-blue-700"
                              size={20}
                            />
                          </div>
                        </div>

                        {/* Section Name */}
                        <h3 className="text-sm sm:text-lg md:text-lg font-semibold text-gray-800 text-center mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                          {item.label}
                        </h3>

                        {/* Section Code */}
                        <div className="text-center hidden md:block">
                          <span className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                            {item.value}
                          </span>
                        </div>

                        {/* Hover Indicator */}
                        <div className="flex-1 mt-4 text-center">
                          <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to open →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaIndustry className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sections found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "No sections match your search."
                    : "No sections available."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {sections.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-center text-blue-800 text-sm">
              💡 <strong>Tip:</strong> Click on any section card to navigate to
              its dashboard
            </div>
          </div>
        )}
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Mobile touch improvements */
        @media (max-width: 768px) {
          .grid-cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .grid-cols-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
