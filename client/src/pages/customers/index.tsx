import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye, SortAsc, SortDesc, Filter } from "lucide-react";
import { Customer } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";

type SortField = "name" | "email" | "createdAt";
type SortOrder = "asc" | "desc";
type StageFilter = "all" | "new" | "pipeline" | "cold" | "warm" | "booked" | "lost";
type FollowUpFilter = "all" | "today" | "yesterday" | "missed" | "future";

export default function CustomersList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>("all");
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // We can use the query parameters to filter customers
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", { stage: stageFilter !== "all" ? stageFilter : undefined, followUpFilter: followUpFilter !== "all" ? followUpFilter : undefined }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, { stage?: string; followUpFilter?: string }];
      const queryParams = new URLSearchParams();
      
      if (params.stage) queryParams.append("stage", params.stage);
      if (params.followUpFilter) queryParams.append("followUpFilter", params.followUpFilter);
      
      const res = await fetch(`/api/customers?${queryParams.toString()}`);
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
  
  // Calculate follow-up counts
  const followUpCounts = useMemo(() => {
    if (!allFollowUps) return { all: 0, today: 0, yesterday: 0, missed: 0, future: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Only count incomplete follow-ups
    const pendingFollowUps = allFollowUps.filter(f => !f.completed && f.nextFollowUpDate);
    
    return {
      all: pendingFollowUps.length,
      today: pendingFollowUps.filter(f => {
        const followUpDate = new Date(f.nextFollowUpDate);
        followUpDate.setHours(0, 0, 0, 0);
        return followUpDate.getTime() === today.getTime();
      }).length,
      yesterday: pendingFollowUps.filter(f => {
        const followUpDate = new Date(f.nextFollowUpDate);
        followUpDate.setHours(0, 0, 0, 0);
        return followUpDate.getTime() === yesterday.getTime();
      }).length,
      missed: pendingFollowUps.filter(f => {
        const followUpDate = new Date(f.nextFollowUpDate);
        followUpDate.setHours(0, 0, 0, 0);
        return followUpDate < today;
      }).length,
      future: pendingFollowUps.filter(f => {
        const followUpDate = new Date(f.nextFollowUpDate);
        followUpDate.setHours(0, 0, 0, 0);
        return followUpDate > today;
      }).length,
    };
  }, [allFollowUps]);
  
  // Sorted and filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    // Text search filter
    let result = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Then sort
    return [...result].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [customers, searchTerm, sortField, sortOrder]);

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/customers/${customerToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer deleted",
        description: `${customerToDelete.name} has been removed.`,
      });
      setCustomerToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <Link href="/customers/add">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading customers...</p>
          </div>
        ) : !customers?.length ? (
          <div className="mt-6 text-center py-8 bg-white shadow rounded-md">
            <p className="text-gray-500 p-8">No customers yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer Stats Card */}
              <Card className="bg-orange-500 text-white overflow-hidden">
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
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">{stageCounts.new}</div>
                      <div className="text-xs uppercase">NEW</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">{stageCounts.warm}</div>
                      <div className="text-xs uppercase">WARM</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">{stageCounts.pipeline}</div>
                      <div className="text-xs uppercase">PIPE</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">{stageCounts.cold}</div>
                      <div className="text-xs uppercase">COLD</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">{stageCounts.booked}</div>
                      <div className="text-xs uppercase">BOOKED</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">{stageCounts.lost}</div>
                      <div className="text-xs uppercase">LOST</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Source Stats Card */}
              <Card className="bg-slate-600 text-white overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center">
                    <span>Lead Source</span>
                    <div className="ml-auto h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                      <span>0</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">0</div>
                      <div className="text-xs uppercase">WALK</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">0</div>
                      <div className="text-xs uppercase">WEB</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">0</div>
                      <div className="text-xs uppercase">REF</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">0</div>
                      <div className="text-xs uppercase">SM</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Follow Up Stats Card */}
              <Card className="bg-green-600 text-white overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center">
                    <span>Follow Up</span>
                    <div className="ml-auto h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                      <span>0</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">0</div>
                      <div className="text-xs uppercase">TODAY</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold text-red-300">0</div>
                      <div className="text-xs uppercase">YESTERDAY</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">0</div>
                      <div className="text-xs uppercase">MISSED</div>
                    </div>
                    <div className="bg-white/10 p-2 rounded">
                      <div className="text-lg font-bold">0</div>
                      <div className="text-xs uppercase">FUTURE</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter customers by stage and follow-up date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 pb-4">
                  {/* Stage Filter */}
                  <div className="w-full sm:w-1/2">
                    <div className="text-sm font-medium mb-2">Customer Stage</div>
                    <Select
                      value={stageFilter}
                      onValueChange={(value) => setStageFilter(value as StageFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="pipeline">Pipeline</SelectItem>
                        <SelectItem value="cold">Cold</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Follow-up Filter */}
                  <div className="w-full sm:w-1/2">
                    <div className="text-sm font-medium mb-2">Follow-up Date</div>
                    <Select
                      value={followUpFilter}
                      onValueChange={(value) => setFollowUpFilter(value as FollowUpFilter)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select follow-up filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Follow-ups</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="missed">Missed</SelectItem>
                        <SelectItem value="future">Future</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Table View */}
            <Card>
              <CardHeader className="pb-3 flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Customer List</CardTitle>
                  <CardDescription>
                    {stageFilter !== 'all' && `Filtered by stage: ${stageFilter}`}
                    {followUpFilter !== 'all' && stageFilter !== 'all' && ' and '}
                    {followUpFilter !== 'all' && `follow-up date: ${followUpFilter}`}
                    {stageFilter === 'all' && followUpFilter === 'all' && 'Showing all customers'}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-full sm:max-w-xs relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search customers..."
                      className="pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                
                  <Select
                    value={sortField}
                    onValueChange={(value) => setSortField(value as SortField)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="createdAt">Date Created</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                        <SortAsc className="mr-2 h-4 w-4" />
                        <span>Ascending</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                        <SortDesc className="mr-2 h-4 w-4" />
                        <span>Descending</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {!filteredCustomers?.length ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No matching customers found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Customer</TableHead>
                        <TableHead>Contact Information</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <span className="mr-2">{customer.name}</span>
                              {customer.stage && (
                                <Badge className={
                                  customer.stage === 'new' ? 'bg-blue-100 text-blue-800' :
                                  customer.stage === 'pipeline' ? 'bg-purple-100 text-purple-800' :
                                  customer.stage === 'cold' ? 'bg-gray-100 text-gray-800' :
                                  customer.stage === 'warm' ? 'bg-orange-100 text-orange-800' :
                                  customer.stage === 'booked' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {customer.stage.charAt(0).toUpperCase() + customer.stage.slice(1)}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{customer.email}</span>
                              <span className="text-sm text-muted-foreground">{customer.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {customer.address}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Link href={`/customers/view/${customer.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                              </Link>
                              <Link href={`/customers/edit/${customer.id}`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCustomerToDelete(customer)}
                                className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <AlertDialog
          open={!!customerToDelete}
          onOpenChange={(open) => !open && setCustomerToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {customerToDelete?.name} and all associated data.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCustomer}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
