import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, FileText, Clock, AlertCircle, Plus, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Customer, Quotation, FollowUp } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface DashboardStats {
  totalCustomers: number;
  totalQuotations: number;
  pendingFollowUps: number;
  recentQuotations: Quotation[];
  recentCustomers: Customer[];
  followUps: FollowUp[];
}

export function ManagerDesignerDashboard() {
  const { user } = useAuth();

  const { data: customersResponse } = useQuery({
    queryKey: ['/api/customers', { page: 1, limit: 100 }], // Get first 100 customers for dashboard
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '100'
      });
      const res = await apiRequest("GET", `/api/customers?${params}`);
      const data = await res.json();
      
      // Handle both old and new API response formats
      if (Array.isArray(data)) {
        return { customers: data, pagination: { page: 1, totalCustomers: data.length, totalPages: 1 } };
      }
      return data;
    },
  });

  const { data: quotations } = useQuery<Quotation[]>({
    queryKey: ['/api/quotations'],
  });

  const { data: followUps } = useQuery<FollowUp[]>({
    queryKey: ['/api/follow-ups/all'],
  });

  // Extract customers from pagination response
  const customers = customersResponse?.customers || [];

  // Calculate stats
  const stats = {
    totalCustomers: customersResponse?.pagination?.totalCustomers || customers.length || 0,
    totalQuotations: quotations?.length || 0,
    pendingFollowUps: followUps?.filter(f => !f.completed).length || 0,
    recentQuotations: quotations?.slice(0, 5) || [],
    recentCustomers: customers?.slice(0, 5) || [],
    pendingFollowUpsList: followUps?.filter(f => !f.completed).slice(0, 5) || [],
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'pipeline': return 'bg-yellow-100 text-yellow-800';
      case 'warm': return 'bg-orange-100 text-orange-800';
      case 'booked': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your customers and projects
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Active customer base
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotations}</div>
            <p className="text-xs text-muted-foreground">
              Total quotations created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Customers</CardTitle>
              <Link href="/customers">
                <Button variant="ghost" size="sm">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentCustomers.map((customer: Customer) => (
                <div key={customer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <Badge className={getStageColor(customer.stage || '')}>
                    {customer.stage || 'Unknown'}
                  </Badge>
                </div>
              ))}
              {stats.recentCustomers.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No customers yet</p>
                  <Link href="/customers/add">
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Follow-ups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                Pending Follow-ups
              </CardTitle>
              <Link href="/customers">
                <Button variant="ghost" size="sm">
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingFollowUpsList.map((followUp) => (
                <div key={followUp.id} className="border rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm">Customer ID: {followUp.customerId}</p>
                    <Badge variant="outline" className="text-xs">
                      Due
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {followUp.notes}
                  </p>
                  {followUp.nextFollowUpDate && (
                    <p className="text-xs text-gray-500">
                      Due: {format(new Date(followUp.nextFollowUpDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              ))}
              {stats.pendingFollowUpsList.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No pending follow-ups</p>
                  <p className="text-xs text-gray-400 mt-1">Great job staying on top of things!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Quotations</CardTitle>
            <Link href="/quotations">
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Quotation</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Customer</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentQuotations.map((quotation) => (
                  <tr key={quotation.id} className="border-b">
                    <td className="py-3">
                      <Link href={`/quotations/view/${quotation.id}`}>
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {quotation.quotationNumber}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 text-sm">Customer #{quotation.customerId}</td>
                    <td className="py-3 text-sm">₹{quotation.finalPrice.toLocaleString()}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs">
                        {quotation.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {format(new Date(quotation.createdAt), 'MMM dd')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.recentQuotations.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No quotations yet</p>
                <Link href="/quotations/create">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quotation
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}