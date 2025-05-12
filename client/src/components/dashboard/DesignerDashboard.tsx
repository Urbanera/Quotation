import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Users, 
  FileText, 
  Check,
  X,
  Clock, 
  Calendar
} from "lucide-react";
import { Customer, Quotation } from "@shared/schema";

export default function DesignerDashboard() {
  // Fetch all the data needed for the dashboard
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  const { data: quotations } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });
  
  const { data: pendingFollowUps } = useQuery<any[]>({
    queryKey: ["/api/follow-ups/pending"],
  });
  
  // Calculate statistics
  const totalCustomers = customers?.length || 0;
  const totalQuotations = quotations?.length || 0;
  
  // Calculate quotation status distribution
  const quotationStatus = {
    draft: quotations?.filter(q => q.status === 'draft').length || 0,
    saved: quotations?.filter(q => q.status === 'saved').length || 0,
    sent: quotations?.filter(q => q.status === 'sent').length || 0,
    approved: quotations?.filter(q => q.status === 'approved').length || 0,
    rejected: quotations?.filter(q => q.status === 'rejected').length || 0,
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
            View follow-ups
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Draft Quotations</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{quotationStatus.draft}</div>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            Continue working
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saved Quotations</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{quotationStatus.saved}</div>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            View quotations
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved Quotations</CardTitle>
          <Check className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{quotationStatus.approved}</div>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            View approved
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected Quotations</CardTitle>
          <X className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{quotationStatus.rejected}</div>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            View rejected
          </Link>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{quotationStatus.sent}</div>
          <Link to="/quotations" className="text-xs text-primary hover:underline mt-2 inline-block">
            View pending
          </Link>
        </CardContent>
      </Card>
      
      {/* Recent Quotations */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Recent Quotations</CardTitle>
          <CardDescription>
            Your recently created quotations
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
                    <Link to={`/quotations/edit/${quotation.id}`} className="text-xs bg-primary text-white px-2 py-1 rounded-md">
                      Edit
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
      
      {/* Pending Follow-ups */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Upcoming Follow-ups</CardTitle>
          <CardDescription>
            Your assigned customer follow-ups
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
    </div>
  );
}