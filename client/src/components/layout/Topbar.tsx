import { useState, useEffect, useRef } from "react";
import { User, Bell, Menu, LogOut, Settings, UserIcon, KeyIcon, LockIcon, FileText, Users } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sidebar from "./Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Customer, Quotation } from "@shared/schema";

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export default function Topbar({ onToggleMobileSidebar }: TopbarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Fetch customers and quotations for search
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    enabled: searchQuery.length > 0,
  });
  
  const { data: quotations = [] } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
    enabled: searchQuery.length > 0,
  });
  
  // Filter search results based on query
  const searchResults = {
    customers: customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    quotations: quotations.filter(quotation =>
      quotation.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
  };
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.length > 0);
  };
  
  // Handle search result click
  const handleSearchResultClick = (type: 'customer' | 'quotation', id: number) => {
    if (type === 'customer') {
      navigate(`/customers/${id}`);
    } else {
      navigate(`/quotations/view/${id}`);
    }
    setSearchQuery("");
    setShowSearchResults(false);
  };
  
  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-lg lg:max-w-xs relative" ref={searchRef}>
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative text-gray-400 focus-within:text-gray-600">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search customers or quotations..."
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            
            {/* Search Results */}
            {showSearchResults && (searchResults.customers.length > 0 || searchResults.quotations.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.customers.length > 0 && (
                  <div className="p-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Customers
                    </h3>
                    {searchResults.customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md flex items-center justify-between"
                        onClick={() => handleSearchResultClick('customer', customer.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{customer.name}</div>
                          <div className="text-sm text-gray-500 truncate">{customer.email}</div>
                        </div>
                        <Badge variant="secondary" className="ml-2 capitalize">
                          {customer.stage}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchResults.quotations.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      Quotations
                    </h3>
                    {searchResults.quotations.map((quotation) => (
                      <div
                        key={quotation.id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md flex items-center justify-between"
                        onClick={() => handleSearchResultClick('quotation', quotation.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{quotation.quotationNumber}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {quotation.title || quotation.description || 'No title'}
                          </div>
                        </div>
                        <Badge 
                          variant={quotation.status === 'approved' ? 'default' : 'secondary'}
                          className="ml-2 capitalize"
                        >
                          {quotation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* No Results Message */}
            {showSearchResults && searchQuery.length > 0 && searchResults.customers.length === 0 && searchResults.quotations.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4 text-center">
                <div className="text-gray-500">No results found for "{searchQuery}"</div>
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <button
            type="button"
            className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="ml-3 relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none"
                  id="user-menu"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@designquotes.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/profile/edit")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/profile/change-password")}
                >
                  <KeyIcon className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    console.log("Logging out...");
                    navigate("/");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
