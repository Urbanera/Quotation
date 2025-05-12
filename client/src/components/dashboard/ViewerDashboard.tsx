import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Users, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  Clock
} from "lucide-react";
import { Customer, Quotation } from "@shared/schema";

export default function ViewerDashboard() {
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
  
  // Calculate statistics
  const totalCustomers = customers?.length || 0;
  const totalQuotations = quotations?.length || 0;
  const totalSalesOrders = salesOrders?.length || 0;
  const totalInvoices = invoices?.length || 0;
  
  // Calculate quotation status distribution
  const approvedQuotations = quotations?.filter(q => q.status === 'approved').length || 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Summary Cards - View only metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCustomers}</div>
          <Link to="/customers" className="text-xs text-primary hover:underline mt-2 inline-block">
            View customers
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuotations}</div>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            View quotations
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved Quotations</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvedQuotations}</div>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            View approved
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
            View sales orders
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
            View invoices
          </Link>
        </CardContent>
      </Card>
      
      {/* Recent Quotations */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Recent Quotations</CardTitle>
          <CardDescription>
            Latest quotations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotations && quotations.length > 0 ? (
            <div className="space-y-4">
              {quotations.slice(0, 5).map(quotation => (
                <div key={quotation.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{quotation.title || `Quotation #${quotation.quotationNumber}`}</p>
                    <p className="text-sm text-muted-foreground">Status: {quotation.status}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm">
                      ₹{quotation.finalPrice.toLocaleString('en-IN')}
                    </span>
                    <Link to={`/quotations/view/${quotation.id}`} className="text-xs bg-primary text-white px-2 py-1 rounded-md">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No recent quotations</div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Sales Orders */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Recent Sales Orders</CardTitle>
          <CardDescription>
            Latest sales orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesOrders && salesOrders.length > 0 ? (
            <div className="space-y-4">
              {salesOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">Order #{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">Status: {order.status}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm">
                      ₹{order.totalAmount?.toLocaleString('en-IN') || 0}
                    </span>
                    <Link to={`/sales-orders/view/${order.id}`} className="text-xs bg-primary text-white px-2 py-1 rounded-md">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No recent sales orders</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}