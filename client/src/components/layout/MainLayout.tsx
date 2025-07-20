import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0">
        <Sidebar onExpandChange={setSidebarExpanded} />
      </div>

      {/* Main content area with dynamic margin */}
      <div 
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ 
          marginLeft: sidebarExpanded ? '256px' : '64px' 
        }}
      >
        <Topbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
