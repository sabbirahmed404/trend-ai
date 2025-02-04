import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <Sidebar />
      </aside>
      <div className="flex-1">
        <Header />
        <main className="flex-1 bg-background">
          <div className="container p-6">{children}</div>
        </main>
      </div>
    </div>
  );
} 