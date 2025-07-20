import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  FileText, 
  Package, 
  Settings,
  UserCog,
  UserCheck,
  Layers,
  ShoppingCart,
  CreditCard,
  Receipt,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CompanySettings } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { useState } from "react";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  onExpandChange?: (expanded: boolean) => void;
}

const allNavigation = [
  { name: "Dashboard", href: "/", icon: Home, module: "dashboard" },
  { name: "Customers", href: "/customers", icon: Users, module: "customers" },
  { name: "Quotations", href: "/quotations", icon: FileText, module: "quotations" },
  { name: "Sales Orders", href: "/sales-orders", icon: ShoppingCart, module: "sales_orders" },
  { name: "Invoices", href: "/invoices", icon: Receipt, module: "invoices" },
  { name: "Payments", href: "/payments", icon: CreditCard, module: "payments" },
  { name: "Products", href: "/products", icon: Package, adminOnly: true },
  { name: "Accessories", href: "/accessories", icon: Layers, adminOnly: true },
  { name: "Teams", href: "/teams", icon: UserCheck, adminOnly: true },
  { name: "Users", href: "/users", icon: UserCog, adminOnly: true },
  { name: "Settings", href: "/settings", icon: Settings, adminOnly: true },
];

export default function Sidebar({ isMobile, onClose, onExpandChange }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { canAccessModule } = usePermissions();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };
  
  // Fetch company settings for name
  const { data: settings } = useQuery<CompanySettings>({
    queryKey: ["/api/settings/company"],
    retry: 1,
  });

  const companyName = settings?.name || "DesignQuotes";

  const handleNavigate = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Filter navigation based on user role and permissions
  const getFilteredNavigation = () => {
    if (!user) return [];
    
    return allNavigation.filter(item => {
      // Always show dashboard
      if (item.module === "dashboard") return true;
      
      // Admin-only items
      if (item.adminOnly && user.role !== 'admin') return false;
      
      // For non-admin users, check permissions
      if (user.role !== 'admin' && item.module) {
        return canAccessModule(item.module);
      }
      
      return true;
    });
  };

  const navigation = getFilteredNavigation();

  return (
    <div className={cn(
      "flex flex-col min-h-0 bg-white border-r border-gray-200 transition-all duration-300",
      isExpanded ? "w-64" : "w-16"
    )}>
      <div className={cn(
        "flex items-center h-16 flex-shrink-0 bg-white px-4",
        isExpanded ? "justify-between" : "justify-center"
      )}>
        <div className="flex items-center">
          {settings?.logo ? (
            <img
              src={settings.logo}
              alt={companyName}
              className="h-10 w-10 object-contain"
            />
          ) : (
            <svg
              className="h-10 w-10 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          )}
          {isExpanded && (
            <h1 className="ml-2 text-gray-800 font-semibold text-lg">{companyName}</h1>
          )}
        </div>
        <button
          onClick={handleToggleExpand}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className={cn(
          "mt-5 flex-1 space-y-2",
          isExpanded ? "px-3" : "px-1"
        )}>
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={handleNavigate}
                className={cn(
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  "group flex items-center rounded-md transition-colors",
                  isExpanded 
                    ? "px-3 py-2 text-sm font-medium" 
                    : "justify-center p-3"
                )}
                title={!isExpanded ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-400 group-hover:text-gray-500",
                    "h-6 w-6",
                    isExpanded && "mr-3"
                  )}
                  aria-hidden="true"
                />
                {isExpanded && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
