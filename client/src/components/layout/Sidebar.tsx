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
  Receipt
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CompanySettings } from "@shared/schema";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Sales Orders", href: "/sales-orders", icon: ShoppingCart },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Accessories", href: "/accessories", icon: Layers },
  { name: "Teams", href: "/teams", icon: UserCheck },
  { name: "Users", href: "/users", icon: UserCog },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isMobile, onClose }: SidebarProps) {
  const [location] = useLocation();
  
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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-600">
        {settings?.logo ? (
          <img
            src={settings.logo}
            alt={companyName}
            className="h-8 w-auto"
          />
        ) : (
          <svg
            className="h-8 w-auto text-white"
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
        <h1 className="ml-2 text-white font-semibold text-lg">{companyName}</h1>
      </div>
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={handleNavigate}
              >
                <a
                  className={cn(
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive
                        ? "text-indigo-600"
                        : "text-gray-400 group-hover:text-gray-500",
                      "mr-3 h-6 w-6"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
