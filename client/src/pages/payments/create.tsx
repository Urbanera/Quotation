import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Customer, customerPaymentFormSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Extension of the schema for client-side validation
const formSchema = customerPaymentFormSchema.extend({
  receiptNumber: z.string().optional(), // Auto-generated on the server
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePaymentPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Generate a unique transaction ID
  const generateTransactionId = () => {
    return `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  };

  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
      console.error("Failed to load customers:", error);
    },
  });

  // Filter customers in 'booked' stage
  const bookedCustomers = customers?.filter(customer => customer.stage === 'booked') || [];
  const allCustomers = customers || [];

  // Create payment form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: undefined,
      amount: undefined,
      paymentMethod: undefined,
      paymentType: undefined,
      paymentDate: new Date(),
      transactionId: generateTransactionId(),
      description: "",
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/customer-payments", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create payment");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-payments"] });
      navigate("/payments");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createPaymentMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payments">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create Customer Payment</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Create a new direct customer payment and generate a receipt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCustomers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Customer Selection */}
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bookedCustomers.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                  Booked Customers (Recommended)
                                </div>
                                {bookedCustomers.map((customer) => (
                                  <SelectItem
                                    key={`booked-${customer.id}`}
                                    value={customer.id.toString()}
                                    className="pl-6"
                                  >
                                    {customer.name} (Booked)
                                  </SelectItem>
                                ))}
                                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground mt-2">
                                  Other Customers
                                </div>
                              </>
                            )}
                            {allCustomers
                              .filter(c => c.stage !== 'booked')
                              .map((customer) => (
                                <SelectItem
                                  key={`other-${customer.id}`}
                                  value={customer.id.toString()}
                                  className="pl-6"
                                >
                                  {customer.name} ({customer.stage})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a customer for this payment. Customers in "booked" stage are recommended.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Amount */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter payment amount"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Method */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">cheque</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Type */}
                  <FormField
                    control={form.control}
                    name="paymentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Type <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="token_advance">Token Advance</SelectItem>
                            <SelectItem value="starting_production">Starting Production</SelectItem>
                            <SelectItem value="final_payment">Final Payment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Date */}
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Payment Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
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
                              selected={field.value as Date}
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

                  {/* Transaction ID */}
                  <FormField
                    control={form.control}
                    name="transactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction ID <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter transaction ID" />
                        </FormControl>
                        <FormDescription>
                          Unique transaction reference for this payment.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Description (For Receipt)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter payment description to be shown on the receipt"
                          className="resize-none min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This description will be displayed on the payment receipt. If left blank, the default receipt terms and conditions from settings will be used.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createPaymentMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {createPaymentMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {!createPaymentMutation.isPending && (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Create Payment & Generate Receipt
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}