"use client";

export default function SectionSelector({ sections, onSectionSelect, title }) {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionSelect(section.value)}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
          >
            <h3 className="font-semibold text-gray-800 mb-2">{section.label}</h3>
            <p className="text-sm text-gray-600">Value: {section.value}</p>
          </button>
        ))}
      </div>
      {sections.length === 0 && (
        <div className="text-gray-500 py-8">No sections available</div>
      )}
    </div>
  );
}