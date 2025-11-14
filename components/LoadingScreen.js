export default function LoadingScreen() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 gap-4 transition-colors duration-300">
      <div className="w-14 h-14 border-4 border-gray-200 dark:border-gray-700 border-t-[#007AFF] dark:border-t-blue-500 rounded-full animate-spin"></div>
      <div className="text-base text-gray-600 dark:text-gray-300">Loading...</div>
    </div>
  );
}