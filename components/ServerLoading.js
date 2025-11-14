export default function ServerLoading({ message, visible }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/50 dark:bg-gray-900/70 flex justify-center items-center z-50 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl flex flex-col items-center gap-2 w-56 shadow-lg transition-colors duration-300">
        <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
        <div className="text-sm font-medium text-blue-500 dark:text-blue-400">Please Wait</div>
        {message && (
          <div className="text-sm text-center text-gray-600 dark:text-gray-300">{message}</div>
        )}
      </div>
    </div>
  );
}