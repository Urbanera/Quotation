import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
import { CustomerPayment, Customer } from "@shared/schema";
import { 
  CreditCard, 
  Plus, 
  FileText, 
  Search, 
  SortAsc, 
  SortDesc, 
  Eye,
  Calendar,
  Wallet,
  CreditCard as CardIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SortField = "receiptNumber" | "paymentDate" | "amount" | "paymentType" | "paymentMethod" | "customer";
type SortOrder = "asc" | "desc";

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("paymentDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  
  const { toast } = useToast();

  // Fetch all customer payments
  const { data: customerPayments, isLoading: isLoadingPayments } = useQuery<CustomerPayment[]>({
    queryKey: ["/api/customer-payments"],
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load customer payments",
        variant: "destructive",
      });
      console.error("Failed to load customer payments:", error);
    },
  });

  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const isLoading = isLoadingPayments || isLoadingCustomers;

  const getCustomerName = (customerId: number) => {
    const customer = customers?.find((c) => c.id === customerId);
    return customer ? customer.name : "Unknown Customer";
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Cash";
      case "bank_transfer":
        return "Bank Transfer";
      case "check":
        return "Check";
      case "card":
        return "Card";
      case "upi":
        return "UPI";
      default:
        return "Other";
    }
  };
  
  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "token_advance":
        return "Token Advance";
      case "starting_production":
        return "Starting Production";
      case "final_payment":
        return "Final Payment";
      default:
        return "Other";
    }
  };
  
  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cash":
        return <Badge className="bg-green-100 text-green-800">Cash</Badge>;
      case "bank_transfer":
        return <Badge className="bg-blue-100 text-blue-800">Bank Transfer</Badge>;
      case "check":
        return <Badge className="bg-purple-100 text-purple-800">Check</Badge>;
      case "card":
        return <Badge className="bg-yellow-100 text-yellow-800">Card</Badge>;
      case "upi":
        return <Badge className="bg-indigo-100 text-indigo-800">UPI</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Other</Badge>;
    }
  };
  
  // Filter payments based on search term and filters
  const filteredPayments = customerPayments
    ? customerPayments.filter((payment) => {
        const matchesSearch =
          payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getCustomerName(payment.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesPaymentType = paymentTypeFilter === 'all' || payment.paymentType === paymentTypeFilter;
        const matchesPaymentMethod = paymentMethodFilter === 'all' || payment.paymentMethod === paymentMethodFilter;
        
        return matchesSearch && matchesPaymentType && matchesPaymentMethod;
      })
    : [];
    
  // Sort the filtered payments
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "receiptNumber":
        comparison = (a.receiptNumber || "").localeCompare(b.receiptNumber || "");
        break;
      case "paymentDate":
        const aDate = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const bDate = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        comparison = aDate - bDate;
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "paymentType":
        comparison = a.paymentType.localeCompare(b.paymentType);
        break;
      case "paymentMethod":
        comparison = a.paymentMethod.localeCompare(b.paymentMethod);
        break;
      case "customer":
        comparison = getCustomerName(a.customerId).localeCompare(getCustomerName(b.customerId));
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <Link href="/payments/create">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Payment
            </Button>
          </Link>
        </div>

        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="w-full sm:max-w-xs relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search payments..."
                className="pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={paymentTypeFilter}
                onValueChange={(value) => setPaymentTypeFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="token_advance">Token Advance</SelectItem>
                  <SelectItem value="starting_production">Starting Production</SelectItem>
                  <SelectItem value="final_payment">Final Payment</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={paymentMethodFilter}
                onValueChange={(value) => setPaymentMethodFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={sortField}
                onValueChange={(value) => setSortField(value as SortField)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receiptNumber">Receipt Number</SelectItem>
                  <SelectItem value="paymentDate">Payment Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="paymentType">Payment Type</SelectItem>
                  <SelectItem value="paymentMethod">Payment Method</SelectItem>
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

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading payments...</p>
            </div>
          ) : !sortedPayments?.length ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No payments found</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm || paymentTypeFilter !== 'all' || paymentMethodFilter !== 'all'
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Create your first payment to get started.'}
              </p>
              <Link href="/payments/create">
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Payment
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {sortedPayments.map((payment) => (
                <li key={payment.id}>
                  <div className="px-4 py-4 flex items-center sm:px-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-indigo-600 truncate">
                          {payment.receiptNumber}
                        </h3>
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {formatCurrency(payment.amount)}
                        </span>
                        <span className="ml-2">
                          {getPaymentMethodBadge(payment.paymentMethod)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-6">
                        <div className="flex items-center text-sm text-gray-500">
                          <Wallet className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{getCustomerName(payment.customerId)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{payment.paymentDate && format(new Date(payment.paymentDate), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>{getPaymentTypeLabel(payment.paymentType)}</span>
                        </div>
                        {payment.transactionId && (
                          <div className="flex items-center text-sm text-gray-500">
                            <CardIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span className="font-mono">{payment.transactionId}</span>
                          </div>
                        )}
                      </div>
                      {payment.description && (
                        <div className="mt-1 text-sm text-gray-500 truncate">
                          {payment.description}
                        </div>
                      )}
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <Link href={`/payments/view/${payment.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Direct Customer Payments</CardTitle>
              <CardDescription>
                Record payments directly from customers without requiring a sales order,
                particularly useful for customers in the "booked" stage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Use direct payments to track:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-500 mb-6">
                <li>Token advances before quotation finalization</li>
                <li>Production start payments</li>
                <li>Final payments upon delivery</li>
                <li>Other miscellaneous payments</li>
              </ul>
              
              <Link href="/payments/create">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Payment
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sales Order Payments</CardTitle>
              <CardDescription>
                Manage payments associated with specific sales orders converted from quotations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Sales order payments are linked to specific orders and track:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-500 mb-6">
                <li>Payment against a specific sales order</li>
                <li>Automatic calculation of remaining balance</li>
                <li>Payment status updates (paid, partially paid, unpaid)</li>
              </ul>
              
              <Link href="/sales-orders">
                <Button variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  View Sales Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}