export default function LoadingScreen() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100 gap-4">
      <div className="w-14 h-14 border-4 border-gray-200 border-t-[#007AFF] rounded-full animate-spin"></div>
      <div className="text-base text-gray-600">Loading...</div>
    </div>
  );
}
