import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Users, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  CreditCard,
  BarChart3,
  UserCheck
} from "lucide-react";
import { Customer, Quotation } from "@shared/schema";

export default function AdminDashboard() {
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
  
  const { data: invoices } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
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
  const totalInvoices = invoices?.length || 0;
  const totalPayments = payments?.length || 0;
  const totalPendingFollowUps = pendingFollowUps?.length || 0;
  
  // Calculate customer stage distribution
  const customerStages = {
    new: customers?.filter(c => c.stage === 'new').length || 0,
    pipeline: customers?.filter(c => c.stage === 'pipeline').length || 0,
    cold: customers?.filter(c => c.stage === 'cold').length || 0,
    warm: customers?.filter(c => c.stage === 'warm').length || 0,
    booked: customers?.filter(c => c.stage === 'booked').length || 0,
    lost: customers?.filter(c => c.stage === 'lost').length || 0,
  };
  
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
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Summary Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCustomers}</div>
          <p className="text-xs text-muted-foreground">
            {customerStages.new} new, {customerStages.booked} booked
          </p>
          <Link to="/customers" className="text-xs text-primary hover:underline mt-2 inline-block">
            View all customers
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
            {quotationStatus.draft} draft, {quotationStatus.approved} approved
          </p>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            View all quotations
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
          <CardTitle className="text-sm font-medium">Invoices</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInvoices}</div>
          <Link to="/invoices" className="text-xs text-primary hover:underline mt-2 inline-block">
            View all invoices
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
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPendingFollowUps}</div>
          <Link to="/customers" className="text-xs text-primary hover:underline mt-2 inline-block">
            View all follow-ups
          </Link>
        </CardContent>
      </Card>
      
      {/* Team Performance Section */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>
            Overview of team performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Detailed team performance metrics will be shown here
          </div>
        </CardContent>
      </Card>
      
      {/* Financial KPIs */}
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Summary of financial metrics
            </CardDescription>
          </div>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Total Quotation Value</p>
              <p className="text-2xl font-bold">
                ₹{quotations?.reduce((sum, q) => sum + q.finalPrice, 0).toLocaleString('en-IN') || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Sales Order Value</p>
              <p className="text-2xl font-bold">
                ₹{salesOrders?.reduce((sum, so) => sum + (so.totalAmount || 0), 0).toLocaleString('en-IN') || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Payments Received</p>
              <p className="text-2xl font-bold">
                ₹{payments?.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN') || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}