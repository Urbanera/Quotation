import React, { useState, useMemo, useRef, useCallback } from "react";
import { format, isSameDay, isBefore, isAfter, startOfDay, subDays } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Edit, Trash2, Eye, SortAsc, SortDesc, Filter, X, 
  Download, Upload, FileText, AlertTriangle, Loader2
} from "lucide-react";
import { Customer, FollowUp } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StageCheckbox from "@/components/StageCheckbox";

type SortField = "name" | "email" | "createdAt";
type SortOrder = "asc" | "desc";
type FollowUpFilter = "all" | "today" | "yesterday" | "missed" | "future";

// Define available stages
const STAGES = ["new", "pipeline", "cold", "warm", "booked", "lost"] as const;
type Stage = (typeof STAGES)[number];

export default function CustomersList() {
  const [searchTerm, setSearchTerm] = useState("");
  // Default sort by createdAt in descending order (newest first)
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedStages, setSelectedStages] = useState<Stage[]>([]);
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>("all");
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>("all");
  const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);
  const [editingStageCustomer, setEditingStageCustomer] = useState<{ id: number, name: string, currentStage: string } | null>(null);
  
  // Import/Export functionality
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{ 
    loading: boolean; 
    success?: boolean; 
    message?: string; 
    results?: any 
  }>({ loading: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch app settings for lead source options
  const { data: appSettings } = useQuery({
    queryKey: ["/api/settings/app"],
    queryFn: async () => {
      const res = await fetch("/api/settings/app");
      return res.json();
    }
  });

  // Fetch customers
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      return res.json();
    },
    // Decrease staleTime to refresh more quickly
    staleTime: 1000, // 1 second
  });

  // Get all customer follow-ups for counting
  const { data: allFollowUps } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups/all"],
    queryFn: async () => {
      const res = await fetch("/api/follow-ups/all");
      return res.json();
    },
    // Decrease staleTime to refresh more quickly
    staleTime: 1000, // 1 second
    // Set refetchInterval to periodically check for updates
    refetchInterval: 2000, // 2 seconds
  });
  
  // Computed values for badges and filter counts
  const stageCounts = useMemo(() => {
    if (!customers) return { all: 0, new: 0, pipeline: 0, cold: 0, warm: 0, booked: 0, lost: 0 };
    
    // Count customers by stage using array methods
    const counts = {
      all: customers.length,
      new: customers.reduce((count, c) => c.stage === "new" ? count + 1 : count, 0),
      pipeline: customers.reduce((count, c) => c.stage === "pipeline" ? count + 1 : count, 0),
      cold: customers.reduce((count, c) => c.stage === "cold" ? count + 1 : count, 0),
      warm: customers.reduce((count, c) => c.stage === "warm" ? count + 1 : count, 0),
      booked: customers.reduce((count, c) => c.stage === "booked" ? count + 1 : count, 0),
      lost: customers.reduce((count, c) => c.stage === "lost" ? count + 1 : count, 0),
    };
    
    return counts;
  }, [customers]);
  
  // Lead source options and counts
  const leadSourcesData = useMemo(() => {
    if (!customers) return { options: [], counts: { all: 0 } };
    
    // Handle missing or invalid leadSourceOptions
    const leadSourceOptionsStr = appSettings?.leadSourceOptions || '';
    const options = leadSourceOptionsStr 
      ? leadSourceOptionsStr.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    
    // Count customers by lead source
    const counts: Record<string, number> = { all: customers.length };
    
    options.forEach((source: string) => {
      counts[source] = customers.reduce((count, c) => 
        c.leadSource === source ? count + 1 : count, 0
      );
    });
    
    return { options, counts };
  }, [customers, appSettings?.leadSourceOptions]);
  
  // Calculate follow-up counts based on the latest pending follow-up for each customer
  const followUpCounts = useMemo(() => {
    if (!allFollowUps || !customers) return {
      all: 0,
      today: 0,
      yesterday: 0,
      missed: 0,
      future: 0
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get all pending follow-ups (not completed)
    // Make sure allFollowUps is an array before filtering
    const pendingFollowUps = Array.isArray(allFollowUps) 
      ? allFollowUps.filter(f => !f.completed && !!f.nextFollowUpDate)
      : [];
    
    // For each customer, find the earliest pending follow-up
    const customerFollowUps = new Map<number, FollowUp>();
    
    // First, organize follow-ups by customer
    pendingFollowUps.forEach(followUp => {
      const existingFollowUp = customerFollowUps.get(followUp.customerId);
      
      // If we don't have a follow-up for this customer yet, or this follow-up is earlier, use it
      if (!existingFollowUp || 
          (followUp.nextFollowUpDate && existingFollowUp.nextFollowUpDate && 
           new Date(followUp.nextFollowUpDate) < new Date(existingFollowUp.nextFollowUpDate))) {
        customerFollowUps.set(followUp.customerId, followUp);
      }
    });
    
    // Now count the follow-ups by category
    let todayCount = 0;
    let yesterdayCount = 0;
    let missedCount = 0;
    let futureCount = 0;
    
    customerFollowUps.forEach(followUp => {
      if (!followUp.nextFollowUpDate) return;
      
      const followUpDate = new Date(followUp.nextFollowUpDate);
      followUpDate.setHours(0, 0, 0, 0);
      
      if (followUpDate.getTime() === today.getTime()) {
        todayCount++;
      } else if (followUpDate.getTime() === yesterday.getTime()) {
        yesterdayCount++;
      } else if (followUpDate < today) {
        missedCount++;
      } else {
        futureCount++;
      }
    });
    
    return {
      all: customerFollowUps.size,
      today: todayCount,
      yesterday: yesterdayCount,
      missed: missedCount,
      future: futureCount
    };
  }, [allFollowUps, customers]);
  
  // Sorted and filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    // First filter by stage and search term
    let filtered = [...customers];
    
    // Apply stage filter - multi-select support
    if (selectedStages.length > 0) {
      filtered = filtered.filter(customer => 
        customer.stage && selectedStages.includes(customer.stage as Stage)
      );
    }
    
    // Apply lead source filter
    if (leadSourceFilter !== 'all') {
      filtered = filtered.filter(customer => 
        customer.leadSource && leadSourceFilter && customer.leadSource === leadSourceFilter
      );
    }
    
    // Apply search filter - case insensitive
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(term) || 
        customer.email.toLowerCase().includes(term) || 
        customer.phone.toLowerCase().includes(term)
      );
    }
    
    // Apply follow-up filter
    if (followUpFilter !== 'all' && allFollowUps) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // First get customer IDs with matching follow-ups
      // Filter out follow-ups that don't have a valid next follow-up date
      const pendingFollowUps = allFollowUps?.filter(f => !f.completed && !!f.nextFollowUpDate) || [];
      
      let customerIdsWithMatchingFollowUps: number[] = [];
      
      if (followUpFilter === 'today') {
        customerIdsWithMatchingFollowUps = pendingFollowUps
          .filter(f => {
            // Skip follow-ups with no date
            if (!f.nextFollowUpDate) return false;
            const followUpDate = new Date(f.nextFollowUpDate);
            followUpDate.setHours(0, 0, 0, 0);
            return followUpDate.getTime() === today.getTime();
          })
          .map(f => f.customerId);
      } else if (followUpFilter === 'yesterday') {
        customerIdsWithMatchingFollowUps = pendingFollowUps
          .filter(f => {
            // Skip follow-ups with no date
            if (!f.nextFollowUpDate) return false;
            const followUpDate = new Date(f.nextFollowUpDate);
            followUpDate.setHours(0, 0, 0, 0);
            return followUpDate.getTime() === yesterday.getTime();
          })
          .map(f => f.customerId);
      } else if (followUpFilter === 'missed') {
        customerIdsWithMatchingFollowUps = pendingFollowUps
          .filter(f => {
            // Skip follow-ups with no date
            if (!f.nextFollowUpDate) return false;
            const followUpDate = new Date(f.nextFollowUpDate);
            followUpDate.setHours(0, 0, 0, 0);
            return followUpDate < today;
          })
          .map(f => f.customerId);
      } else if (followUpFilter === 'future') {
        customerIdsWithMatchingFollowUps = pendingFollowUps
          .filter(f => {
            // Skip follow-ups with no date
            if (!f.nextFollowUpDate) return false;
            const followUpDate = new Date(f.nextFollowUpDate);
            followUpDate.setHours(0, 0, 0, 0);
            return followUpDate > today;
          })
          .map(f => f.customerId);
      }
      
      // Only show customers with matching follow-ups
      filtered = filtered.filter(c => customerIdsWithMatchingFollowUps.includes(c.id));
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      // For string fields
      if (sortField === 'name' || sortField === 'email') {
        const aVal = a[sortField].toLowerCase();
        const bVal = b[sortField].toLowerCase();
        
        if (sortOrder === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      } 
      
      // For date fields
      if (sortField === 'createdAt') {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        
        if (sortOrder === 'asc') {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      }
      
      return 0;
    });
  }, [customers, searchTerm, sortField, sortOrder, selectedStages, followUpFilter, leadSourceFilter, allFollowUps]);

  // Utility functions for follow-ups
  const getLatestFollowUp = useCallback((customerId: number) => {
    if (!allFollowUps || !Array.isArray(allFollowUps)) return null;
    
    const customerFollowUps = allFollowUps.filter(f => f.customerId === customerId);
    if (customerFollowUps.length === 0) return null;
    
    // Sort by createdAt date descending and get the most recent
    return customerFollowUps.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )[0];
  }, [allFollowUps]);
  
  const getNextFollowUp = useCallback((customerId: number) => {
    if (!allFollowUps || !Array.isArray(allFollowUps)) return null;
    
    const now = new Date();
    const customerFollowUps = allFollowUps.filter(f => 
      f.customerId === customerId && 
      !f.completed &&
      f.nextFollowUpDate
    );
    
    if (customerFollowUps.length === 0) return null;
    
    // Sort by scheduled date ascending to get the next upcoming
    return customerFollowUps.sort((a, b) => {
      const dateA = new Date(a.nextFollowUpDate || 0).getTime();
      const dateB = new Date(b.nextFollowUpDate || 0).getTime();
      return dateA - dateB;
    })[0];
  }, [allFollowUps]);
  
  const isOverdue = useCallback((dateStr?: string | Date) => {
    if (!dateStr) return false;
    
    const date = new Date(dateStr);
    const now = new Date();
    
    return date < startOfDay(now);
  }, []);

  // Update customer stage mutation
  const updateCustomerStageMutation = useMutation({
    mutationFn: async ({ customerId, newStage }: { customerId: number, newStage: string }) => {
      const response = await apiRequest("PUT", `/api/customers/${customerId}/stage`, { stage: newStage });
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups/all"] });
      
      // Format stage name with first letter capitalized
      const formattedStage = variables.newStage.charAt(0).toUpperCase() + variables.newStage.slice(1);
      
      toast({
        title: "Stage Updated",
        description: `Customer stage has been updated successfully to ${formattedStage}`,
      });
      
      // Close the dialog
      setEditingStageCustomer(null);
    },
    onError: (error: any) => {
      console.error("Stage update error:", error);
      let errorMessage = "Failed to update customer stage";
      
      // Try to extract message from error
      if (error.message) {
        errorMessage = error.message;
      }
      
      // If error message contains HTML, it's likely a server error
      if (typeof errorMessage === 'string' && errorMessage.includes('<!DOCTYPE')) {
        errorMessage = "Server error occurred. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Delete customer handler
  const handleDeleteCustomer = async () => {
    if (!deleteCustomerId) return;
    
    try {
      await apiRequest("DELETE", `/api/customers/${deleteCustomerId}`);
      
      // Invalidate customers cache to reload the list
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      toast({
        title: "Customer Deleted",
        description: "Customer has been deleted successfully",
      });
      
      // Close the dialog
      setDeleteCustomerId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    }
  };
  
  // Update customer stage handler
  const handleUpdateCustomerStage = (newStage: string) => {
    if (!editingStageCustomer) return;
    
    updateCustomerStageMutation.mutate({
      customerId: editingStageCustomer.id,
      newStage
    });
  };

  // Export customers handler
  const handleExportCustomers = () => {
    try {
      // Create CSV data directly from the customers list in the state
      // This bypasses the problematic server export endpoint
      if (!customers || customers.length === 0) {
        toast({
          title: "No Customers",
          description: "There are no customers to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV header
      const headers = [
        'Name', 'Email', 'Phone', 'Address', 'Current Stage', 
        'Lead Source', 'Last Follow-up Date', 'Next Follow-up Date'
      ].join(',') + '\n';
      
      // Process customer data to include follow-ups
      const customerFollowUps = new Map();
      if (allFollowUps && allFollowUps.length > 0) {
        allFollowUps.forEach(followUp => {
          if (!customerFollowUps.has(followUp.customerId)) {
            customerFollowUps.set(followUp.customerId, []);
          }
          customerFollowUps.get(followUp.customerId).push(followUp);
        });
      }
      
      // Create CSV rows
      let csvContent = headers;
      customers.forEach(customer => {
        const customerFollowUpsList = customerFollowUps.get(customer.id) || [];
        
        // Sort follow-ups by date desc and get the latest one
        const sortedFollowUps = [...customerFollowUpsList].sort((a, b) => 
          new Date(b.interactionDate).getTime() - new Date(a.interactionDate).getTime()
        );
        
        const latestFollowUp = sortedFollowUps[0] || null;
        const lastFollowUpDate = latestFollowUp?.interactionDate ? 
          new Date(latestFollowUp.interactionDate).toISOString().split('T')[0] : '';
        const nextFollowUpDate = latestFollowUp?.completed && latestFollowUp.nextFollowUpDate ? 
          new Date(latestFollowUp.nextFollowUpDate).toISOString().split('T')[0] : '';
        
        const row = [
          `"${(customer.name || '').replace(/"/g, '""')}"`,
          `"${(customer.email || '').replace(/"/g, '""')}"`,
          `"${(customer.phone || '').replace(/"/g, '""')}"`,
          `"${(customer.address || '').replace(/"/g, '""')}"`,
          `"${(customer.stage || '').replace(/"/g, '""')}"`,
          `"${(customer.leadSource || '').replace(/"/g, '""')}"`,
          `"${lastFollowUpDate}"`,
          `"${nextFollowUpDate}"`
        ].join(',') + '\n';
        
        csvContent += row;
      });
      
      // Create a blob with the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv' });
      
      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers.csv';
      
      // Click the download link
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: `Exported ${customers.length} customers successfully`,
      });
    } catch (error) {
      console.error('Error exporting customers:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export customers. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Debug export function for troubleshooting
  const handleDebugExport = async () => {
    try {
      const response = await fetch('/api/customers/export-debug');
      const data = await response.json();
      console.log('Debug Export Response:', data);
      
      toast({
        title: "Debug Export Response",
        description: `Found ${data.customers?.length || 0} customers. Check console for details.`,
      });
    } catch (error) {
      console.error('Debug export error:', error);
      toast({
        title: "Debug Export Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };

  // Import customers - file select handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type - should be CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }
    
    // Process file upload
    handleImportCustomers(file);
  };
  
  // Import customers - actual upload handler
  const handleImportCustomers = async (file: File) => {
    setImportStatus({ loading: true });
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Import failed');
      }
      
      // Update status with results
      setImportStatus({
        loading: false,
        success: true,
        message: result.message,
        results: result.results
      });
      
      // Invalidate customers query to refresh list
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
    } catch (error: any) {
      setImportStatus({
        loading: false,
        success: false,
        message: error.message || 'An error occurred during import'
      });
    }
  };

  return (
    <div className="container p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportCustomers} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button asChild>
            <Link to="/customers/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Stats Card */}
            <Card className="bg-primary text-white overflow-hidden h-[190px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <span>Customer</span>
                  <div className="ml-auto h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span>{stageCounts.all}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${selectedStages.includes("new") ? "ring-2 ring-white" : ""}`}
                    onClick={() => {
                      // Toggle "new" in the selectedStages array
                      setSelectedStages(prev => 
                        prev.includes("new")
                          ? prev.filter(s => s !== "new")
                          : [...prev, "new"]
                      );
                    }}
                  >
                    <div className="text-sm font-semibold">{stageCounts.new}</div>
                    <div className="text-xs">New</div>
                  </div>
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${selectedStages.includes("pipeline") ? "ring-2 ring-white" : ""}`}
                    onClick={() => {
                      setSelectedStages(prev => 
                        prev.includes("pipeline")
                          ? prev.filter(s => s !== "pipeline")
                          : [...prev, "pipeline"]
                      );
                    }}
                  >
                    <div className="text-sm font-semibold">{stageCounts.pipeline}</div>
                    <div className="text-xs">Pipeline</div>
                  </div>
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${selectedStages.includes("cold") ? "ring-2 ring-white" : ""}`}
                    onClick={() => {
                      setSelectedStages(prev => 
                        prev.includes("cold")
                          ? prev.filter(s => s !== "cold")
                          : [...prev, "cold"]
                      );
                    }}
                  >
                    <div className="text-sm font-semibold">{stageCounts.cold}</div>
                    <div className="text-xs">Cold</div>
                  </div>
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${selectedStages.includes("warm") ? "ring-2 ring-white" : ""}`}
                    onClick={() => {
                      setSelectedStages(prev => 
                        prev.includes("warm")
                          ? prev.filter(s => s !== "warm")
                          : [...prev, "warm"]
                      );
                    }}
                  >
                    <div className="text-sm font-semibold">{stageCounts.warm}</div>
                    <div className="text-xs">Warm</div>
                  </div>
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${selectedStages.includes("booked") ? "ring-2 ring-white" : ""}`}
                    onClick={() => {
                      setSelectedStages(prev => 
                        prev.includes("booked")
                          ? prev.filter(s => s !== "booked")
                          : [...prev, "booked"]
                      );
                    }}
                    style={{ gridColumn: 'span 2' }}
                  >
                    <div className="text-sm font-semibold">{stageCounts.booked}</div>
                    <div className="text-xs">Booked</div>
                  </div>
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${selectedStages.includes("lost") ? "ring-2 ring-white" : ""}`}
                    onClick={() => {
                      setSelectedStages(prev => 
                        prev.includes("lost")
                          ? prev.filter(s => s !== "lost")
                          : [...prev, "lost"]
                      );
                    }}
                    style={{ gridColumn: 'span 2' }}
                  >
                    <div className="text-sm font-semibold">{stageCounts.lost}</div>
                    <div className="text-xs">Lost</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Follow-up Stats Card */}
            <Card className="bg-primary text-white overflow-hidden h-[190px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <span>Follow-ups</span>
                  <div className="ml-auto h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span>{followUpCounts.all}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${followUpFilter === "today" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setFollowUpFilter(followUpFilter === "today" ? "all" : "today")}
                  >
                    <div className="text-sm font-semibold">{followUpCounts.today}</div>
                    <div className="text-xs">Today</div>
                  </div>
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${followUpFilter === "yesterday" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setFollowUpFilter(followUpFilter === "yesterday" ? "all" : "yesterday")}
                  >
                    <div className="text-sm font-semibold">{followUpCounts.yesterday}</div>
                    <div className="text-xs">Yesterday</div>
                  </div>
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${followUpFilter === "missed" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setFollowUpFilter(followUpFilter === "missed" ? "all" : "missed")}
                  >
                    <div className="text-sm font-semibold">{followUpCounts.missed}</div>
                    <div className="text-xs">Missed</div>
                  </div>
                  <div 
                    className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${followUpFilter === "future" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setFollowUpFilter(followUpFilter === "future" ? "all" : "future")}
                  >
                    <div className="text-sm font-semibold">{followUpCounts.future}</div>
                    <div className="text-xs">Future</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Source Stats Card */}
            <Card className="bg-primary text-white overflow-hidden h-[190px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <span>Lead Sources</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-3 gap-2 text-center h-[120px]">
                  {leadSourcesData.options.length > 0 ? (
                    leadSourcesData.options.map((source: string) => (
                      <div 
                        key={source}
                        className={`bg-white/10 py-1 px-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${leadSourceFilter === source ? "ring-2 ring-white" : ""}`}
                        onClick={() => setLeadSourceFilter(leadSourceFilter === source ? "all" : source)}
                      >
                        <div className="text-sm font-semibold">{leadSourcesData.counts[source] || 0}</div>
                        <div className="text-xs truncate">{source}</div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4 text-sm">
                      No lead sources defined
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Active Filters Area */}
          <div className="flex flex-wrap gap-2 items-center">
            {selectedStages.length > 0 && selectedStages.map(stage => (
              <Badge key={stage} variant="outline" className="flex items-center gap-1 py-1 px-3">
                Stage: {stage.charAt(0).toUpperCase() + stage.slice(1)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSelectedStages(prev => prev.filter(s => s !== stage))}
                />
              </Badge>
            ))}
            
            {followUpFilter !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1 py-1 px-3">
                Follow-up: {followUpFilter && typeof followUpFilter === 'string' ? (followUpFilter.charAt(0).toUpperCase() + followUpFilter.slice(1)) : 'All'}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFollowUpFilter("all")}
                />
              </Badge>
            )}
            
            {leadSourceFilter !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1 py-1 px-3">
                Source: {leadSourceFilter}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setLeadSourceFilter("all")}
                />
              </Badge>
            )}
            
            {(selectedStages.length > 0 || followUpFilter !== "all" || leadSourceFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={() => {
                  setSelectedStages([]);
                  setFollowUpFilter("all");
                  setLeadSourceFilter("all");
                }}
              >
                Clear All
              </Button>
            )}
          </div>
          
          {/* Search Bar and Sorting */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <X
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
            
            <Select 
              value={sortField} 
              onValueChange={(value) => setSortField(value as SortField)}
            >
              <SelectTrigger className="w-[140px]">
                <span className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Sort by
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="createdAt">Date added</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              className="h-10 w-10"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Customers List Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Latest Follow-up</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || selectedStages.length > 0 || followUpFilter !== "all" || leadSourceFilter !== "all" ? (
                        <>No customers match your filters. Try adjusting your search or filters.</>
                      ) : (
                        <>No customers found. Add a customer to get started.</>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div 
                          className="font-medium cursor-pointer hover:text-primary hover:underline"
                          onClick={() => navigate(`/customers/${customer.id}`)}
                        >
                          {customer.name}
                        </div>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        <Badge 
                          className={`${
                            customer.stage === "new" ? "bg-blue-100 text-blue-800" : 
                            customer.stage === "pipeline" ? "bg-purple-100 text-purple-800" : 
                            customer.stage === "cold" ? "bg-gray-100 text-gray-800" : 
                            customer.stage === "warm" ? "bg-orange-100 text-orange-800" : 
                            customer.stage === "booked" ? "bg-green-100 text-green-800" : 
                            "bg-red-100 text-red-800"
                          } cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => setEditingStageCustomer({ 
                            id: customer.id, 
                            name: customer.name,
                            currentStage: customer.stage
                          })}
                        >
                          {customer.stage && typeof customer.stage === 'string' ? (customer.stage.charAt(0).toUpperCase() + customer.stage.slice(1)) : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const latestFollowUp = getLatestFollowUp(customer.id);
                          if (latestFollowUp) {
                            const notes = latestFollowUp.notes || '';
                            if (notes.length > 40) {
                              return (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <div className="cursor-pointer">
                                      {notes.substring(0, 40)}...
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-semibold">Follow-up Notes</h4>
                                      <p className="text-sm">{notes}</p>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              );
                            } else {
                              return <span>{notes}</span>;
                            }
                          }
                          return <span className="text-muted-foreground text-sm">No follow-ups</span>;
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const nextFollowUp = getNextFollowUp(customer.id);
                          if (nextFollowUp && nextFollowUp.nextFollowUpDate) {
                            try {
                              const date = new Date(nextFollowUp.nextFollowUpDate);
                              return (
                                <span className={`${isOverdue(nextFollowUp.nextFollowUpDate) ? 'text-red-600 font-medium' : ''}`}>
                                  {format(date, 'MMM dd, yyyy')}
                                </span>
                              );
                            } catch (e) {
                              return <span className="text-muted-foreground text-sm">Invalid date</span>;
                            }
                          }
                          return <span className="text-muted-foreground text-sm">None scheduled</span>;
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            asChild
                          >
                            <Link to={`/customers/view/${customer.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            asChild
                          >
                            <Link to={`/customers/edit/${customer.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setDeleteCustomerId(customer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Customers</DialogTitle>
            <DialogDescription>
              Upload a CSV file with customer data. The file should include the following columns:
              Name, Email, Phone, Address, City, Current Stage, Lead Source, Notes.
            </DialogDescription>
          </DialogHeader>
          
          {!importStatus.loading && !importStatus.success && !importStatus.message && (
            <div className="grid w-full max-w-sm items-center gap-1.5 mx-auto mt-4">
              <label htmlFor="customer-csv" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileText className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-center text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    CSV file only (.csv)
                  </p>
                </div>
                <input 
                  id="customer-csv" 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          )}
          
          {importStatus.loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-center text-sm text-gray-500">
                Uploading and processing your customer data...
              </p>
            </div>
          )}
          
          {importStatus.message && (
            <div className={`rounded-lg p-4 ${importStatus.success ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
              <div className="flex items-start">
                {importStatus.success ? (
                  <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">{importStatus.message}</p>
                  
                  {importStatus.results && (
                    <div className="mt-2 text-sm">
                      <p>Total: {importStatus.results.total}</p>
                      <p>Created: {importStatus.results.created}</p>
                      <p>Skipped: {importStatus.results.skipped}</p>
                      
                      {importStatus.results.errors && importStatus.results.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Errors:</p>
                          <ul className="list-disc list-inside mt-1">
                            {importStatus.results.errors.slice(0, 5).map((error: string, index: number) => (
                              <li key={index} className="text-xs">{error}</li>
                            ))}
                            {importStatus.results.errors.length > 5 && (
                              <li className="text-xs">...and {importStatus.results.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setImportStatus({ loading: false });
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Close
            </Button>
            
            {importStatus.success && (
              <Button
                type="button"
                onClick={() => {
                  setImportStatus({ loading: false });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                  }
                }}
              >
                Upload Another
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteCustomerId !== null} onOpenChange={() => setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              and all related data including quotations, sales orders, and payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteCustomer}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Stage Update Dialog */}
      <Dialog open={editingStageCustomer !== null} onOpenChange={(open) => !open && setEditingStageCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Customer Stage</DialogTitle>
            <DialogDescription>
              Update the stage for customer <span className="font-semibold">{editingStageCustomer?.name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div 
              onClick={() => handleUpdateCustomerStage('new')}
              className={`flex flex-col items-center justify-center h-20 ${editingStageCustomer?.currentStage === 'new' ? 'bg-blue-100 border-blue-300' : ''}`}
              style={{ cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
            >
              <div className="font-medium mb-1">New</div>
              <div className="text-xs text-gray-500">Initial contact</div>
            </div>
            
            <div 
              onClick={() => handleUpdateCustomerStage('warm')}
              className={`flex flex-col items-center justify-center h-20 ${editingStageCustomer?.currentStage === 'warm' ? 'bg-orange-100 border-orange-300' : ''}`}
              style={{ cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
            >
              <div className="font-medium mb-1">Warm</div>
              <div className="text-xs text-gray-500">Interested</div>
            </div>
            
            <div 
              onClick={() => handleUpdateCustomerStage('pipeline')}
              className={`flex flex-col items-center justify-center h-20 ${editingStageCustomer?.currentStage === 'pipeline' ? 'bg-purple-100 border-purple-300' : ''}`}
              style={{ cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
            >
              <div className="font-medium mb-1">Pipeline</div>
              <div className="text-xs text-gray-500">Actively engaged</div>
            </div>
            
            <div 
              onClick={() => handleUpdateCustomerStage('cold')}
              className={`flex flex-col items-center justify-center h-20 ${editingStageCustomer?.currentStage === 'cold' ? 'bg-gray-100 border-gray-300' : ''}`}
              style={{ cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
            >
              <div className="font-medium mb-1">Cold</div>
              <div className="text-xs text-gray-500">Needs nurturing</div>
            </div>
            
            <div 
              onClick={() => handleUpdateCustomerStage('booked')}
              className={`flex flex-col items-center justify-center h-20 ${editingStageCustomer?.currentStage === 'booked' ? 'bg-green-100 border-green-300' : ''}`}
              style={{ cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
            >
              <div className="font-medium mb-1">Booked</div>
              <div className="text-xs text-gray-500">Confirmed order</div>
            </div>
            
            <div 
              onClick={() => handleUpdateCustomerStage('lost')}
              className={`flex flex-col items-center justify-center h-20 ${editingStageCustomer?.currentStage === 'lost' ? 'bg-red-100 border-red-300' : ''}`}
              style={{ cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
            >
              <div className="font-medium mb-1">Lost</div>
              <div className="text-xs text-gray-500">Not proceeding</div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStageCustomer(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}