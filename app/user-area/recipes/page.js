'use client';

import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/utils/firebaseConfig";

export default function SectionSelection() {
  const router = useRouter();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const sectionsData = await getDocs(collection(db, "sections"));
        const sectionsArray = sectionsData.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setSections(sectionsArray);
      } catch (error) {
        console.error("Error fetching sections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  const handleSectionSelect = (sectionId) => {
    router.push(`/user-area/recipes/${sectionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose a Section
          </h1>
          <p className="text-lg text-gray-600">
            Select a section to view its recipes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionSelect(section.value)}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 hover:border-blue-200 text-center"
            >
              <h3 className="text-xl font-semibold text-blue-600 mb-1">
                {section.label}
              </h3>
              <p className="text-sm text-gray-500">{section.value}</p>
            </button>
          ))}
        </div>

        {sections.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No sections available
          </div>
        )}
      </div>
    </div>
  );
}