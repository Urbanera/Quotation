import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Users, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  CreditCard,
  UserCheck,
  Calendar
} from "lucide-react";
import { Customer, Quotation } from "@shared/schema";

export default function ManagerDashboard() {
  // Fetch all the data needed for the dashboard
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  const { data: quotations } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });
  
  const { data: salesOrders } = useQuery<any[]>({
    queryKey: ["/api/sales-orders"],
  });
  
  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });
  
  const { data: pendingFollowUps } = useQuery<any[]>({
    queryKey: ["/api/follow-ups/pending"],
  });
  
  // Calculate statistics
  const totalCustomers = customers?.length || 0;
  const totalQuotations = quotations?.length || 0;
  const totalSalesOrders = salesOrders?.length || 0;
  const totalPayments = payments?.length || 0;
  const totalPendingFollowUps = pendingFollowUps?.length || 0;
  
  // Calculate quotation status distribution
  const quotationStatus = {
    draft: quotations?.filter(q => q.status === 'draft').length || 0,
    saved: quotations?.filter(q => q.status === 'saved').length || 0,
    sent: quotations?.filter(q => q.status === 'sent').length || 0,
    approved: quotations?.filter(q => q.status === 'approved').length || 0,
    rejected: quotations?.filter(q => q.status === 'rejected').length || 0,
    expired: quotations?.filter(q => q.status === 'expired').length || 0,
    converted: quotations?.filter(q => q.status === 'converted').length || 0,
  };
  
  // TODO: Get today's date and filter for today's follow-ups
  const todaysFollowUps = pendingFollowUps?.length || 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Summary Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Follow-ups</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaysFollowUps}</div>
          <Link to="/customers" className="text-xs text-primary hover:underline mt-2 inline-block">
            View all follow-ups
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quotations</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuotations}</div>
          <p className="text-xs text-muted-foreground">
            {quotationStatus.saved} saved, {quotationStatus.sent} sent
          </p>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            View all quotations
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{quotationStatus.sent}</div>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            Review quotations
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCustomers}</div>
          <Link to="/customers" className="text-xs text-primary hover:underline mt-2 inline-block">
            View all customers
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sales Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSalesOrders}</div>
          <Link to="/sales-orders" className="text-xs text-primary hover:underline mt-2 inline-block">
            View all sales orders
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPayments}</div>
          <Link to="/payments" className="text-xs text-primary hover:underline mt-2 inline-block">
            View all payments
          </Link>
        </CardContent>
      </Card>
      
      {/* Pending Follow-ups */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Pending Follow-ups</CardTitle>
          <CardDescription>
            Upcoming customer follow-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingFollowUps && pendingFollowUps.length > 0 ? (
            <div className="space-y-4">
              {pendingFollowUps.map((followUp: any) => (
                <div key={followUp.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{followUp.customerName}</p>
                    <p className="text-sm text-muted-foreground">{followUp.notes}</p>
                  </div>
                  <div className="text-sm">
                    {new Date(followUp.interactionDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No pending follow-ups</div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest quotations and sales orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quotations && quotations.length > 0 ? (
              quotations.slice(0, 5).map(quotation => (
                <div key={quotation.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{quotation.title || `Quotation #${quotation.quotationNumber}`}</p>
                    <p className="text-sm text-muted-foreground">Status: {quotation.status}</p>
                  </div>
                  <div className="text-sm">
                    ₹{quotation.finalPrice.toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No recent quotations</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}