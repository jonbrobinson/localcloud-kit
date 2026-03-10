"use client";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 animate-pulse">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gray-200" />
              <div className="space-y-2">
                <div className="h-7 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-64 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-9 w-24 bg-gray-200 rounded-md" />
              <div className="h-9 w-20 bg-gray-200 rounded-md" />
              <div className="h-9 w-28 bg-gray-200 rounded-md" />
              <div className="h-9 w-9 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Services status bar */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center space-x-2">
            <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <div className="h-4 w-14 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center space-x-2">
            <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
          </div>
        </div>

        {/* Resource list placeholder */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="flex space-x-2">
              <div className="h-9 w-24 bg-gray-200 rounded-md" />
              <div className="h-9 w-28 bg-gray-200 rounded-md" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
              >
                <div className="h-10 w-10 rounded bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
                <div className="h-8 w-20 bg-gray-100 rounded-md" />
                <div className="h-8 w-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="h-3 w-64 bg-gray-100 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}
