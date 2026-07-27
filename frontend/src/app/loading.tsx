export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative flex flex-col items-center">
        {/* Minimalist Spinner */}
        <div className="w-12 h-12 border-4 border-[#0F766E]/20 border-t-[#0F766E] rounded-full animate-spin"></div>
        <p className="mt-6 text-xs font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
