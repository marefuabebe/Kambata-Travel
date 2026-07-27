export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative flex flex-col items-center">
        {/* Minimalist Spinner */}
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold tracking-widest text-gray-500 uppercase animate-pulse">
          Loading Data...
        </p>
      </div>
    </div>
  );
}
