export default function InfoList({
  setAddInfoView,
  addInfoView,
  currentInfoFields,
  removeInfoField,
  newFields,
  updateInfoField,
  loading,
  removeNewInfoField,
}) {
  const newFieldsArray = Object.entries(newFields);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-white">
          {newFieldsArray.length > 0 ? "New Field Added" : "Information"}
        </h3>
        
        <div className="flex gap-2">
          {!addInfoView && (
            <button
              onClick={() => setAddInfoView(true)}
              className="px-3 py-1 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
            >
              Add New Info
            </button>
          )}

          {Object.keys(newFields).length > 0 && (
            <button
              onClick={updateInfoField}
              disabled={loading}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                loading
                  ? "bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed"
                  : "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {newFieldsArray.length > 0 ? (
          <div>
            {newFieldsArray.map(([fieldName, fieldValue], index) => (
              <div
                key={fieldName}
                className={`flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 ${
                  index === 0 ? "rounded-t-lg" : ""
                } ${
                  index === newFieldsArray.length - 1 ? "rounded-b-lg border-b-0" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-white">Field Name: {fieldName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Field Value: {fieldValue}</div>
                </div>

                <button
                  onClick={() => removeNewInfoField(fieldName)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 transition-colors"
                  title="Remove field"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {currentInfoFields.map(([fieldName, fieldValue], index) => (
              <div
                key={fieldName}
                className={`flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 ${
                  index === 0 ? "rounded-t-lg" : ""
                } ${
                  index === currentInfoFields.length - 1 ? "rounded-b-lg border-b-0" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-white">Field Name: {fieldName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Field Value: {fieldValue}</div>
                </div>

                <button
                  onClick={() => removeInfoField(fieldName)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 transition-colors"
                  title="Delete field"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}