"use client";
import { useEffect, useState } from 'react';
import Firebase from '@/utils/firebase';

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const sectionsData = await Firebase.getDocuments('sections');
        setSections(sectionsData || []);
      } catch (error) {
        console.error('Error fetching sections:', error);
        alert('Failed to load sections');
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  const handleAddSection = async () => {
    if (!newSectionLabel.trim()) {
      alert('Please enter a section label.');
      return;
    }

    try {
      setSaving(true);
      const newSection = {
        label: newSectionLabel.trim(),
        value: newSectionLabel.trim().toLowerCase().replace(/\s+/g, '_'),
      };
      
      await Firebase.createDoc('sections', newSection);
      
      // Re-fetch sections after adding
      const updatedSections = await Firebase.getDocuments('sections');
      setSections(updatedSections || []);
      setModalVisible(false);
      setNewSectionLabel('');
      
      alert('Section added successfully!');
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section.');
    } finally {
      setSaving(false);
    }
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sections Management</h1>
        
        {/* Sections List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-20">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Available Sections ({sections.length})
            </h2>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {sections.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {sections.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-800">{item.label}</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No sections found. Add your first section!
              </div>
            )}
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setModalVisible(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Add New Section"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Modal to add new section */}
        {modalVisible && (
          <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Add New Section</h2>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Label
                  </label>
                  <input
                    type="text"
                    value={newSectionLabel}
                    onChange={(e) => setNewSectionLabel(e.target.value)}
                    placeholder="Enter section label"
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Section value will be auto-generated: {newSectionLabel.trim().toLowerCase().replace(/\s+/g, '_')}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalVisible(false)}
                    disabled={saving}
                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleAddSection}
                    disabled={saving}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      'Save Section'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">About Sections:</h4>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• Sections help organize your products and materials</li>
            <li>• Each section creates separate collections in the database</li>
            <li>• Section value is auto-generated from the label</li>
            <li>• Examples: &quot;Biscuit&quot; → &quot;biscuit&quot;, &quot;Packaging Material&quot; → &quot;packaging_material&quot;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}