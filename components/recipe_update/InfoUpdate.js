export default function InfoUpdate({ infos, handleInfoChange }) {
  if (!infos) return null;
  
  const filterKeys = Object.keys(infos);

  return (
    <div className="info-update-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
      <h3 className="info-title text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        Update Product Information
      </h3>
      <div className="space-y-4">
        {filterKeys.map((key) => (
          <div key={key} className="info-row flex flex-col space-y-2">
            <label className="info-label text-sm font-medium text-gray-700 dark:text-gray-300">
              {key.replace(/_/g, " ").toUpperCase()}
            </label>
            <input
              type="text"
              className="info-input w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 outline-none transition-colors duration-300"
              value={infos[key]?.toString() || ''}
              onChange={(e) => {
                handleInfoChange(key, e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}