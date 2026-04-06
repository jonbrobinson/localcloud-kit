import Link from "next/link";
import ConnectionGuide from "@/components/ConnectionGuide";
import ManageHeaderBrand from "@/components/ManageHeaderBrand";

export default function ConnectPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <ManageHeaderBrand />
              <div>
                <h1 className="text-xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">Connections</p>
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConnectionGuide />
      </div>
    </main>
  );
}
