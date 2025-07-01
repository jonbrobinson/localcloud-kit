import Link from "next/link";
import ConnectionGuide from "@/components/ConnectionGuide";

export default function ConnectPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 group">
                <img
                  src="/logo.svg"
                  alt="CloudStack Solutions"
                  width={40}
                  height={40}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    LocalStack Manager
                  </h1>
                  <p className="text-sm text-gray-500">
                    by CloudStack Solutions
                  </p>
                </div>
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
