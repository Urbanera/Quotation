import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye, SortAsc, SortDesc, Filter, X } from "lucide-react";
import { Customer, FollowUp } from "@shared/schema";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SortField = "name" | "email" | "createdAt";
type SortOrder = "asc" | "desc";
type StageFilter = "all" | "new" | "pipeline" | "cold" | "warm" | "booked" | "lost";
type FollowUpFilter = "all" | "today" | "yesterday" | "missed" | "future";

export default function CustomersList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>("all");
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>("all");
  const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);
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
    }
  });

  // Get all customer follow-ups for counting
  const { data: allFollowUps } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups/all"],
    queryFn: async () => {
      const res = await fetch("/api/follow-ups/all");
      return res.json();
    }
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
    const pendingFollowUps = allFollowUps.filter(f => !f.completed && !!f.nextFollowUpDate);
    
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
    
    // Apply stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(customer => customer.stage === stageFilter);
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
  }, [customers, searchTerm, sortField, sortOrder, stageFilter, followUpFilter, allFollowUps]);

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

  return (
    <div className="container p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button asChild>
          <Link to="/customers/add">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Link>
        </Button>
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
            <Card className="bg-primary text-white overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <span>Customer</span>
                  <div className="ml-auto h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span>{stageCounts.all}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${stageFilter === "new" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setStageFilter(stageFilter === "new" ? "all" : "new")}
                  >
                    <div className="text-lg font-bold">{stageCounts.new}</div>
                    <div className="text-xs uppercase">NEW</div>
                  </div>
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${stageFilter === "warm" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setStageFilter(stageFilter === "warm" ? "all" : "warm")}
                  >
                    <div className="text-lg font-bold">{stageCounts.warm}</div>
                    <div className="text-xs uppercase">WARM</div>
                  </div>
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${stageFilter === "pipeline" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setStageFilter(stageFilter === "pipeline" ? "all" : "pipeline")}
                  >
                    <div className="text-lg font-bold">{stageCounts.pipeline}</div>
                    <div className="text-xs uppercase">PIPE</div>
                  </div>
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${stageFilter === "cold" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setStageFilter(stageFilter === "cold" ? "all" : "cold")}
                  >
                    <div className="text-lg font-bold">{stageCounts.cold}</div>
                    <div className="text-xs uppercase">COLD</div>
                  </div>
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${stageFilter === "booked" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setStageFilter(stageFilter === "booked" ? "all" : "booked")}
                  >
                    <div className="text-lg font-bold">{stageCounts.booked}</div>
                    <div className="text-xs uppercase">BOOKED</div>
                  </div>
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${stageFilter === "lost" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setStageFilter(stageFilter === "lost" ? "all" : "lost")}
                  >
                    <div className="text-lg font-bold">{stageCounts.lost}</div>
                    <div className="text-xs uppercase">LOST</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Source Stats Card */}
            <Card className="bg-secondary text-white overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <span>Lead Source</span>
                  <div className="ml-auto h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span>{leadSourcesData.options?.length || 0}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid ${(leadSourcesData.options?.length || 0) > 4 ? 'grid-cols-3' : 'grid-cols-4'} gap-2 text-center`}>
                  {(leadSourcesData.options || []).slice(0, 6).map((source: string) => {
                    // Create abbreviated display name (first 4 chars or first word)
                    // Make sure source is not undefined and is a string
                    const displayName = source && typeof source === 'string'
                      ? (source.includes(' ') 
                          ? source.split(' ')[0].toUpperCase() 
                          : source.slice(0, 4).toUpperCase())
                      : 'N/A';
                    
                    return (
                      <div 
                        key={source}
                        className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${leadSourceFilter === source ? "ring-2 ring-white" : ""}`}
                        onClick={() => setLeadSourceFilter(leadSourceFilter === source ? "all" : source)}
                      >
                        <div className="text-lg font-bold">{leadSourcesData.counts[source] || 0}</div>
                        <div className="text-xs uppercase">{displayName}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Follow Up Stats Card */}
            <Card className="bg-green-600 text-white overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <span>Follow Up</span>
                  <div className="ml-auto h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span>{followUpCounts.all}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${followUpFilter === "today" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setFollowUpFilter(followUpFilter === "today" ? "all" : "today")}
                  >
                    <div className="text-lg font-bold">{followUpCounts.today}</div>
                    <div className="text-xs uppercase">TODAY</div>
                  </div>
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${followUpFilter === "yesterday" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setFollowUpFilter(followUpFilter === "yesterday" ? "all" : "yesterday")}
                  >
                    <div className="text-lg font-bold">{followUpCounts.yesterday}</div>
                    <div className="text-xs uppercase">YESTERDAY</div>
                  </div>
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${followUpFilter === "missed" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setFollowUpFilter(followUpFilter === "missed" ? "all" : "missed")}
                  >
                    <div className="text-lg font-bold">{followUpCounts.missed}</div>
                    <div className="text-xs uppercase">MISSED</div>
                  </div>
                  <div 
                    className={`bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors ${followUpFilter === "future" ? "ring-2 ring-white" : ""}`}
                    onClick={() => setFollowUpFilter(followUpFilter === "future" ? "all" : "future")}
                  >
                    <div className="text-lg font-bold">{followUpCounts.future}</div>
                    <div className="text-xs uppercase">FUTURE</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 items-center">
            {stageFilter !== "all" && (
              <Badge variant="outline" className="py-1 px-3">
                Stage: {stageFilter && typeof stageFilter === 'string' ? (stageFilter.charAt(0).toUpperCase() + stageFilter.slice(1)) : 'All'}
                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setStageFilter("all")} />
              </Badge>
            )}
            {followUpFilter !== "all" && (
              <Badge variant="outline" className="py-1 px-3">
                Follow-up: {followUpFilter && typeof followUpFilter === 'string' ? (followUpFilter.charAt(0).toUpperCase() + followUpFilter.slice(1)) : 'All'}
                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setFollowUpFilter("all")} />
              </Badge>
            )}
            {leadSourceFilter !== "all" && (
              <Badge variant="outline" className="py-1 px-3">
                Source: {leadSourceFilter && typeof leadSourceFilter === 'string' 
                  ? (leadSourceFilter.charAt(0).toUpperCase() + leadSourceFilter.slice(1)) 
                  : 'Unknown'}
                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setLeadSourceFilter("all")} />
              </Badge>
            )}
            {(stageFilter !== "all" || followUpFilter !== "all" || leadSourceFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setStageFilter("all");
                  setFollowUpFilter("all");
                  setLeadSourceFilter("all");
                }}
                className="h-7"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Customer Table View */}
          <Card>
            <CardHeader className="pb-3 flex flex-row justify-between items-center">
              <div>
                <CardTitle>Customers</CardTitle>
                <CardDescription>
                  {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => {
                        if (sortField === "name") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("name");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      Name 
                      {sortField === "name" && (
                        sortOrder === "asc" ? <SortAsc className="inline ml-1 h-4 w-4" /> : <SortDesc className="inline ml-1 h-4 w-4" />
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => {
                        if (sortField === "email") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("email");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      Email 
                      {sortField === "email" && (
                        sortOrder === "asc" ? <SortAsc className="inline ml-1 h-4 w-4" /> : <SortDesc className="inline ml-1 h-4 w-4" />
                      )}
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => {
                        if (sortField === "createdAt") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("createdAt");
                          setSortOrder("asc");
                        }
                      }}
                    >
                      Created At 
                      {sortField === "createdAt" && (
                        sortOrder === "asc" ? <SortAsc className="inline ml-1 h-4 w-4" /> : <SortDesc className="inline ml-1 h-4 w-4" />
                      )}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No customers found. Try changing your filters or create a new customer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-accent/50">
                        <TableCell className="font-medium">{customer.name}</TableCell>
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
                            }`}
                          >
                            {customer.stage && typeof customer.stage === 'string' ? (customer.stage.charAt(0).toUpperCase() + customer.stage.slice(1)) : 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/customers/view/${customer.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/customers/edit/${customer.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeleteCustomerId(customer.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteCustomerId !== null} onOpenChange={() => setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this customer and all associated data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}