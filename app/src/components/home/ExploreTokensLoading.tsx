export default function ExploreTokensLoading() {
  return (
    <div className="pt-[68px] md:px-6">
      <div className="w-full flex flex-col md:flex-row justify-center text-center md:text-start gap-2 md:justify-between items-center mb-5 md:mb-12">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
        <div className="h-6 bg-gray-200 rounded animate-pulse w-64"></div>
      </div>
      
      <div className="relative w-full overflow-hidden">
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 animate-pulse" style={{ width: `calc((100% - 0.6rem) / 3)` }}>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                  </div>
                  <div className="mt-4 h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-row justify-between items-center mt-8 gap-4">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
          
          <div className='flex justify-center'>
            <div className="border border-gray-200 max-w-[200px] flex rounded-full">
              <div className="h-8 md:h-10 w-8 md:w-12 bg-gray-200 rounded-l-full"></div>
              <div className="h-8 md:h-10 w-8 md:w-12 bg-gray-200 rounded-r-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
