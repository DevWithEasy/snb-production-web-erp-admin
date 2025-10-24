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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">
          {newFieldsArray.length > 0 ? "New Field Added" : "Information"}
        </h3>
        
        <div className="flex gap-2">
          {!addInfoView && (
            <button
              onClick={() => setAddInfoView(true)}
              className="px-3 py-1 border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Add New Info
            </button>
          )}

          {Object.keys(newFields).length > 0 && (
            <button
              onClick={updateInfoField}
              disabled={loading}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
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
                className={`flex justify-between items-center p-4 border-b border-gray-100 ${
                  index === 0 ? "rounded-t-lg" : ""
                } ${
                  index === newFieldsArray.length - 1 ? "rounded-b-lg border-b-0" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Field Name: {fieldName}</div>
                  <div className="text-sm text-gray-600">Field Value: {fieldValue}</div>
                </div>

                <button
                  onClick={() => removeNewInfoField(fieldName)}
                  className="text-red-600 hover:text-red-800 p-1"
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
                className={`flex justify-between items-center p-4 border-b border-gray-100 ${
                  index === 0 ? "rounded-t-lg" : ""
                } ${
                  index === currentInfoFields.length - 1 ? "rounded-b-lg border-b-0" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Field Name: {fieldName}</div>
                  <div className="text-sm text-gray-600">Field Value: {fieldValue}</div>
                </div>

                <button
                  onClick={() => removeInfoField(fieldName)}
                  className="text-red-600 hover:text-red-800 p-1"
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