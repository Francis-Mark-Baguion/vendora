const SkeletonViewProductLoader = () => {
  return (
    <main className="max-w-7xl mx-auto p-10 grid grid-cols-3 gap-12 mt-20 animate-pulse">
      {/* Skeleton Thumbnails */}
      <div className="col-span-1 flex flex-col items-center space-y-3">
        {Array(4)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="w-24 h-24 bg-gray-200 rounded-md" />
          ))}
      </div>

      {/* Skeleton Main Image */}
      <div className="col-span-1 flex justify-center">
        <div className="w-full h-96 bg-gray-200 rounded-lg" />
      </div>

      {/* Skeleton Details */}
      <div className="col-span-1 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-6 bg-gray-300 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />

        <div className="mt-4">
          <div className="h-4 bg-gray-300 w-24 mb-2 rounded" />
          <div className="flex space-x-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full" />
            <div className="w-6 h-6 bg-gray-300 rounded-full" />
          </div>
        </div>

        <div className="mt-4">
          <div className="h-4 bg-gray-300 w-24 mb-2 rounded" />
          <div className="flex space-x-2">
            {["XS", "S", "M", "L", "XL"].map((size) => (
              <div key={size} className="px-4 py-2 bg-gray-200 rounded" />
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center space-x-4">
          <div className="w-28 h-10 bg-gray-200 rounded" />
          <div className="w-32 h-10 bg-gray-300 rounded" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        </div>

        <div className="mt-6 border-t pt-4 space-y-2">
          <div className="h-4 bg-gray-300 w-40 rounded" />
          <div className="h-3 bg-gray-200 w-3/4 rounded" />
        </div>
        <div className="mt-2 border-t pt-4 space-y-2">
          <div className="h-4 bg-gray-300 w-40 rounded" />
          <div className="h-3 bg-gray-200 w-3/4 rounded" />
        </div>
      </div>
    </main>
  );
};
