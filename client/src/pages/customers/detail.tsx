import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ClipboardList, 
  FileText, 
  Mail, 
  MapPin, 
  Phone, 
  ChevronLeft, 
  CalendarClock, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Clock,
  FileEdit
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Customer, FollowUp, Quotation, insertFollowUpSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const followUpFormSchema = insertFollowUpSchema.extend({
  nextFollowUpDate: z.date({
    required_error: "A follow-up date is required",
  }),
});

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [completingId, setCompletingId] = useState<number | null>(null);
  const customerId = parseInt(id);

  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    queryFn: () => fetch(`/api/customers/${customerId}`).then((res) => res.json()),
    enabled: !isNaN(customerId),
  });

  const { data: followUps, isLoading: isLoadingFollowUps } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups", customerId],
    queryFn: () => fetch(`/api/follow-ups?customerId=${customerId}`).then((res) => res.json()),
    enabled: !isNaN(customerId),
  });

  const { data: quotations, isLoading: isLoadingQuotations } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations", "customer", customerId],
    queryFn: () => fetch(`/api/quotations?customerId=${customerId}`).then((res) => res.json()),
    enabled: !isNaN(customerId),
  });

  const form = useForm<z.infer<typeof followUpFormSchema>>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      customerId,
      notes: "",
      completed: false,
    },
  });

  const followUpMutation = useMutation({
    mutationFn: (data: z.infer<typeof followUpFormSchema>) => {
      return apiRequest("POST", "/api/follow-ups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups", customerId] });
      toast({
        title: "Follow-up created",
        description: "The follow-up has been scheduled successfully.",
      });
      form.reset({
        customerId,
        notes: "",
        completed: false,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create follow-up. Please try again.",
        variant: "destructive",
      });
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: (followUpId: number) => {
      setCompletingId(followUpId);
      return apiRequest("PUT", `/api/follow-ups/${followUpId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups", customerId] });
      toast({
        title: "Follow-up completed",
        description: "The follow-up has been marked as complete.",
      });
      setCompletingId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark follow-up as complete. Please try again.",
        variant: "destructive",
      });
      setCompletingId(null);
    },
  });

  function onFollowUpSubmit(values: z.infer<typeof followUpFormSchema>) {
    followUpMutation.mutate(values);
  }

  function handleMarkComplete(followUpId: number) {
    markCompleteMutation.mutate(followUpId);
  }

  if (isLoadingCustomer) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/customers">
              <Button variant="outline" size="sm" className="mr-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Customers
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Loading Customer...</h1>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/customers">
              <Button variant="outline" size="sm" className="mr-4">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Customers
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-red-600">Customer Not Found</h1>
          </div>
          <div className="mt-6 bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-600">The customer you are looking for does not exist or has been deleted.</p>
            <Link href="/customers">
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                View All Customers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center mb-5">
          <Link href="/customers">
            <Button variant="outline" size="sm" className="mr-4">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Customers
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">{customer.name}</h1>
          <Link href={`/customers/edit/${customer.id}`}>
            <Button variant="outline" size="sm" className="ml-4">
              <FileEdit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Customer Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and contact information.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email address
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{customer.email}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{customer.phone}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{customer.address}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Notes
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {customer.notes ? customer.notes : <span className="text-gray-400 italic">No notes available</span>}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <Tabs defaultValue="follow-ups" className="w-full mb-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="follow-ups" className="flex items-center">
              <CalendarClock className="h-4 w-4 mr-2" />
              Follow-ups
            </TabsTrigger>
            <TabsTrigger value="quotations" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Quotations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="follow-ups">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Schedule a Follow-up</h3>
                <div className="mt-5">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onFollowUpSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Follow-up Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter follow-up details, discussion points, or action items..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nextFollowUpDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Follow-up Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        disabled={followUpMutation.isPending}
                      >
                        {followUpMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Scheduling...
                          </div>
                        ) : (
                          <>Schedule Follow-up</>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Follow-up History</h3>
              {isLoadingFollowUps ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading follow-ups...</p>
                </div>
              ) : !followUps?.length ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg py-10 text-center">
                  <p className="text-gray-500">No follow-ups recorded yet.</p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    {followUps.map((followUp) => (
                      <li key={followUp.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-full ${followUp.completed ? 'bg-green-100' : followUp.nextFollowUpDate && new Date(followUp.nextFollowUpDate) < new Date() ? 'bg-red-100' : 'bg-yellow-100'}`}>
                              {followUp.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-amber-600" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {followUp.completed ? 'Completed' : 'Scheduled'} Follow-up
                                </h4>
                                {followUp.completed ? (
                                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                                    Completed
                                  </Badge>
                                ) : followUp.nextFollowUpDate && new Date(followUp.nextFollowUpDate) < new Date() ? (
                                  <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">
                                    Overdue
                                  </Badge>
                                ) : (
                                  <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">
                                {followUp.notes}
                              </div>
                              <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-4">
                                {followUp.createdAt && (
                                  <div>Created: {format(new Date(followUp.createdAt), 'PPP')}</div>
                                )}
                                {followUp.nextFollowUpDate && (
                                  <div>Follow-up Date: {format(new Date(followUp.nextFollowUpDate), 'PPP')}</div>
                                )}
                                {followUp.completed && (
                                  <div>Completed: {format(new Date(followUp.interactionDate), 'PPP')}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          {!followUp.completed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkComplete(followUp.id)}
                              disabled={markCompleteMutation.isPending && completingId === followUp.id}
                            >
                              {markCompleteMutation.isPending && completingId === followUp.id ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                                  Marking...
                                </div>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Mark Complete
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="quotations">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Customer Quotations</h3>
                  <Link href={`/quotations/create?customerId=${customer.id}`}>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Create New Quotation
                    </Button>
                  </Link>
                </div>
                
                {isLoadingQuotations ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading quotations...</p>
                  </div>
                ) : !quotations?.length ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-500">No quotations created for this customer yet.</p>
                  </div>
                ) : (
                  <div className="mt-5">
                    <Table>
                      <TableCaption>A list of quotations for {customer.name}</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quotation #</TableHead>
                          <TableHead>Created Date</TableHead>
                          <TableHead>Final Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotations.map((quotation) => (
                          <TableRow key={quotation.id}>
                            <TableCell className="font-medium">#{quotation.id}</TableCell>
                            <TableCell>{format(new Date(quotation.createdAt), 'PP')}</TableCell>
                            <TableCell>₹{quotation.finalPrice.toLocaleString('en-IN')}</TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Link href={`/quotations/view/${quotation.id}`}>
                                  <Button variant="outline" size="sm">
                                    View
                                  </Button>
                                </Link>
                                <Link href={`/quotations/edit/${quotation.id}`}>
                                  <Button variant="outline" size="sm">
                                    Edit
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}