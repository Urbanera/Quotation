import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SalesOrder, paymentFormSchema } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Create a specific form schema for this form with defaults
const formSchema = paymentFormSchema.extend({
  paymentDate: z.date({
    required_error: "Payment date is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddPaymentPage() {
  const { id } = useParams();
  const orderId = parseInt(id);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch the sales order
  const { data: salesOrder, isLoading } = useQuery<SalesOrder>({
    queryKey: ["/api/sales-orders", orderId],
    enabled: !isNaN(orderId),
  });

  // Define form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesOrderId: orderId,
      amount: 0,
      paymentMethod: "bank_transfer",
      paymentDate: new Date(),
      notes: "",
    },
  });

  // Payment recording mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest(
        "POST",
        `/api/sales-orders/${orderId}/payments`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment recorded",
        description: "Payment has been successfully recorded",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders", orderId, "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      navigate(`/sales-orders/view/${orderId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    recordPaymentMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!salesOrder) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Sales Order Not Found</h2>
          <p className="mb-4">The requested sales order does not exist or has been deleted.</p>
          <Link href="/sales-orders">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sales Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate max payment amount (cannot exceed due amount)
  const maxPaymentAmount = salesOrder.amountDue;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/sales-orders/view/${orderId}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Record Payment</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0.01"
                            max={maxPaymentAmount}
                            {...field}
                            onChange={(e) => {
                              // Convert string value to number
                              field.onChange(
                                e.target.value === "" ? 0 : parseFloat(e.target.value)
                              );
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum payment: {formatCurrency(maxPaymentAmount)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Payment Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction ID *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter transaction ID" />
                        </FormControl>
                        <FormDescription>
                          Reference number or transaction ID for this payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes about this payment"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={recordPaymentMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {recordPaymentMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Record Payment
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-medium">{salesOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium">{formatCurrency(salesOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p className="font-medium text-green-600">{formatCurrency(salesOrder.amountPaid)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Due</p>
                  <p className="font-medium text-red-600">{formatCurrency(salesOrder.amountDue)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className="font-medium">
                    <span className={`px-2 py-1 rounded text-xs inline-block ${
                      salesOrder.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : salesOrder.paymentStatus === 'partially_paid'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {salesOrder.paymentStatus.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <div className="text-center">
                <CreditCard className="h-10 w-10 mx-auto text-indigo-500 mb-2" />
                <p className="text-sm text-gray-500">
                  Record all payment transactions to keep track of your finances
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}