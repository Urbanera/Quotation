import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import { SalesOrder, CustomerPayment } from "@shared/schema";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, FileText, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LedgerEntry {
  id: number;
  date: Date;
  description: string;
  type: "debit" | "credit";
  amount: number;
  referenceId: string;
  referenceType: "sales_order" | "payment";
  balance?: number; // Running balance
}

interface CustomerLedgerProps {
  customerId: number;
}

export function CustomerLedger({ customerId }: CustomerLedgerProps) {
  // Fetch customer sales orders
  const { data: salesOrders, isLoading: isLoadingSalesOrders } = useQuery<SalesOrder[]>({
    queryKey: ["/api/customers", customerId, "sales-orders"],
  });

  // Fetch customer payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery<CustomerPayment[]>({
    queryKey: ["/api/customers", customerId, "payments"],
  });

  const isLoading = isLoadingSalesOrders || isLoadingPayments;

  // Combine and sort ledger entries
  const ledgerEntries: LedgerEntry[] = [];
  
  if (salesOrders) {
    salesOrders.forEach(order => {
      ledgerEntries.push({
        id: order.id,
        date: new Date(order.orderDate),
        description: `Sales Order: ${order.orderNumber}`,
        type: "debit", // Sales orders are debits (money owed to company)
        amount: order.totalAmount,
        referenceId: order.orderNumber,
        referenceType: "sales_order"
      });
    });
  }
  
  if (payments) {
    payments.forEach(payment => {
      ledgerEntries.push({
        id: payment.id,
        date: new Date(payment.paymentDate),
        description: `Payment: ${payment.paymentType || 'General'} (${payment.paymentMethod})`,
        type: "credit", // Payments are credits (reducing amount owed)
        amount: payment.amount,
        referenceId: payment.receiptNumber,
        referenceType: "payment"
      });
    });
  }
  
  // Sort entries by date (most recent first)
  ledgerEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Calculate running balance
  let balance = 0;
  ledgerEntries.forEach(entry => {
    if (entry.type === "debit") {
      balance += entry.amount;
    } else {
      balance -= entry.amount;
    }
    entry.balance = balance;
  });
  
  // Reverse to show oldest first
  ledgerEntries.reverse();
  
  // Calculate opening and closing balances
  const initialBalance = 0;
  let runningBalance = initialBalance;
  
  // Calculate total debits and credits
  const totalDebits = ledgerEntries
    .filter(entry => entry.type === "debit")
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const totalCredits = ledgerEntries
    .filter(entry => entry.type === "credit")
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const currentBalance = totalDebits - totalCredits;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Ledger</CardTitle>
          <CardDescription>Loading financial transactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Ledger</CardTitle>
        <CardDescription>
          Track debits (sales orders) and credits (payments) for this customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Debits</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalDebits)}</p>
                </div>
                <ArrowUpCircle className="h-8 w-8 text-destructive opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCredits)}</p>
                </div>
                <ArrowDownCircle className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    currentBalance > 0 ? "text-destructive" : "text-primary"
                  )}>
                    {formatCurrency(Math.abs(currentBalance))}
                    <span className="text-sm font-normal ml-1">
                      {currentBalance > 0 ? "(Due)" : "(Advance)"}
                    </span>
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {ledgerEntries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Opening Balance Row */}
              <TableRow className="bg-muted/40">
                <TableCell colSpan={5} className="font-medium">
                  Opening Balance
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(initialBalance)}
                </TableCell>
              </TableRow>
              
              {ledgerEntries.map((entry, index) => {
                // Update running balance
                if (entry.type === "debit") {
                  runningBalance += entry.amount;
                } else {
                  runningBalance -= entry.amount;
                }
                
                return (
                  <TableRow key={`${entry.referenceType}-${entry.id}`}>
                    <TableCell>
                      {format(entry.date, "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {entry.referenceType === "sales_order" ? (
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Receipt className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        {entry.description}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.referenceId}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.type === "debit" ? formatCurrency(entry.amount) : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.type === "credit" ? formatCurrency(entry.amount) : ""}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      runningBalance > 0 ? "text-destructive" : "text-primary"
                    )}>
                      {formatCurrency(Math.abs(runningBalance))}
                      <span className="text-xs ml-1">
                        {runningBalance > 0 ? "(Dr)" : "(Cr)"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Closing Balance Row */}
              <TableRow className="bg-muted/40 font-medium">
                <TableCell colSpan={5}>
                  Closing Balance
                </TableCell>
                <TableCell className={cn(
                  "text-right font-medium",
                  runningBalance > 0 ? "text-destructive" : "text-primary"
                )}>
                  {formatCurrency(Math.abs(runningBalance))}
                  <span className="text-xs ml-1">
                    {runningBalance > 0 ? "(Dr)" : "(Cr)"}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            <CreditCard className="mx-auto h-12 w-12 mb-4 text-muted-foreground/80" />
            <p>No financial transactions found for this customer</p>
            <p className="text-sm mt-2">
              Transactions will appear here when sales orders are created or payments are received
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}