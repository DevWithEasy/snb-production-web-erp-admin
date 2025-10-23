export default function ServerLoading({ message, visible }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/50 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-5 rounded-xl flex flex-col items-center gap-2 w-56 shadow-lg">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-sm font-medium text-blue-500">Please Wait</div>
        {message && (
          <div className="text-sm text-center text-gray-600">{message}</div>
        )}
      </div>
    </div>
  );
}