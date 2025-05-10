import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, Plus, FolderPlus, Bell } from "lucide-react";
import { Customer, Quotation } from "@shared/schema";
import PendingFollowUps from "@/components/customers/PendingFollowUps";

export default function Dashboard() {
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: quotations, isLoading: isLoadingQuotations } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Overview Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Customers</CardTitle>
              <CardDescription>Manage your client base</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  {isLoadingCustomers ? "..." : 
                    customers?.filter(customer => customer.stage !== "lost").length || 0}
                </div>
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4">
                <Link href="/customers/add">
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Quotations</CardTitle>
              <CardDescription>Manage your quotations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  {isLoadingQuotations ? "..." : quotations?.length || 0}
                </div>
                <div className="p-2 bg-indigo-100 rounded-full">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4">
                <Link href="/quotations/create">
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quotation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/customers">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  View All Customers
                </Button>
              </Link>
              <Link href="/quotations">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  View All Quotations
                </Button>
              </Link>
              <Link href="/quotations/create">
                <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Quotation
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Pending Follow-ups Section */}
        <div className="mt-8">
          <PendingFollowUps />
        </div>

        {/* Recent Quotations */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Quotations</h2>
            <Link href="/quotations">
              <Button variant="link" className="text-indigo-600">View all</Button>
            </Link>
          </div>
          
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {isLoadingQuotations ? (
                <li className="px-6 py-4 text-center text-gray-500">Loading...</li>
              ) : !quotations?.length ? (
                <li className="px-6 py-4 text-center text-gray-500">No quotations yet</li>
              ) : (
                quotations.slice(0, 5).map((quotation) => (
                  <li key={quotation.id}>
                    <Link href={`/quotations/view/${quotation.id}`}>
                      <div className="block hover:bg-gray-50 cursor-pointer">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              Quotation #{quotation.id}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                ₹{(quotation.finalPrice || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                Customer ID: {quotation.customerId}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Created {new Date(quotation.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
        
        {/* Recent Customers */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Customers</h2>
            <Link href="/customers">
              <Button variant="link" className="text-indigo-600">View all</Button>
            </Link>
          </div>
          
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {isLoadingCustomers ? (
                <li className="px-6 py-4 text-center text-gray-500">Loading...</li>
              ) : !customers?.length ? (
                <li className="px-6 py-4 text-center text-gray-500">No customers yet</li>
              ) : (
                customers.slice(0, 5).map((customer) => (
                  <li key={customer.id}>
                    <Link href={`/customers/edit/${customer.id}`}>
                      <div className="block hover:bg-gray-50 cursor-pointer">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {customer.name}
                            </p>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                {customer.email}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                {customer.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
