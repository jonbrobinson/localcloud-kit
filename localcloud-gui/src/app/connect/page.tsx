import Link from "next/link";
import ConnectionGuide from "@/components/ConnectionGuide";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function ConnectPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <img
                  src="/logo.svg"
                  alt="CloudStack Solutions"
                  width={40}
                  height={40}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    LocalCloud Kit
                  </h1>
                  <p className="text-sm text-gray-500">Connection Guide</p>
                </div>
              </div>
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
