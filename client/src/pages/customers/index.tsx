import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye, ArrowUpDown, SortAsc, SortDesc } from "lucide-react";
import { Customer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CustomerStageFilter from "@/components/customers/CustomerStageFilter";
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

type SortField = "name" | "email" | "createdAt";
type SortOrder = "asc" | "desc";

export default function CustomersList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Sorted and filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    // First filter
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
            {/* Customer Stage Filter View */}
            <CustomerStageFilter customers={customers} />

            {/* Traditional List View */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-4">
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
                
                <div className="flex items-center gap-2">
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
              </div>

              {!filteredCustomers?.length ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No matching customers found.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <li key={customer.id}>
                      <div className="px-4 py-4 flex items-center sm:px-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-indigo-600 truncate mr-2">{customer.name}</h3>
                            {customer.stage && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                customer.stage === 'new' ? 'bg-blue-100 text-blue-800' :
                                customer.stage === 'pipeline' ? 'bg-purple-100 text-purple-800' :
                                customer.stage === 'cold' ? 'bg-gray-100 text-gray-800' :
                                customer.stage === 'warm' ? 'bg-orange-100 text-orange-800' :
                                customer.stage === 'booked' ? 'bg-green-100 text-green-800' : ''
                              }`}>
                                {customer.stage.charAt(0).toUpperCase() + customer.stage.slice(1)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex">
                            <div className="flex items-center text-sm text-gray-500 mr-6">
                              <span className="truncate">{customer.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{customer.phone}</span>
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            <span>{customer.address}</span>
                          </div>
                        </div>
                        <div className="ml-5 flex-shrink-0 flex space-x-2">
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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
