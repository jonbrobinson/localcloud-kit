import ConnectionGuide from "@/components/ConnectionGuide";
import AppNavBar from "@/components/AppNavBar";

export default function ConnectPage() {
  return (
    <main className="min-h-screen bg-bg">
      <AppNavBar pageLabel="Connections" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConnectionGuide />
      </div>
    </main>
  );
}
