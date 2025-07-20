import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="md:pl-16 flex flex-col flex-1">
        <Topbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
