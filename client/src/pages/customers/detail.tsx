import React, { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  FileEdit,
  Tag,
  CreditCard,
  Eye,
  Edit,
  Copy,
  Trash2
} from "lucide-react";
import { CustomerLedger } from "@/components/customers/CustomerLedger";
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

// Enhanced follow-up type with user information
type EnhancedFollowUp = FollowUp & {
  userName?: string;
  userUsername?: string;
};
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const followUpFormSchema = insertFollowUpSchema.extend({
  nextFollowUpDate: z.date({
    required_error: "A follow-up date is required",
  }),
  interactionDate: z.date().default(() => new Date()),
  updateCustomerStage: z.boolean().default(false),
  newCustomerStage: z.enum(['new', 'pipeline', 'cold', 'warm', 'booked', 'lost']).optional(),
});

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [quotationToDuplicate, setQuotationToDuplicate] = useState<Quotation | null>(null);
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
      interactionDate: new Date(),
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
        interactionDate: new Date(),
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

  const [showStageDialog, setShowStageDialog] = useState(false);
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<number | null>(null);
  const [updateStage, setUpdateStage] = useState(false);
  const [newStage, setNewStage] = useState<string | null>(customer?.stage || null);
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | null>(new Date());
  const [nextFollowUpNotes, setNextFollowUpNotes] = useState<string>("");
  
  // Effect to handle changing next follow-up date when stage changes to "lost"
  useEffect(() => {
    if (updateStage && newStage === "lost") {
      setNextFollowUpDate(null);
    } else if (nextFollowUpDate === null && (!updateStage || newStage !== "lost")) {
      setNextFollowUpDate(new Date());
    }
  }, [updateStage, newStage, nextFollowUpDate]);

  // Delete quotation mutation
  const deleteQuotationMutation = useMutation({
    mutationFn: async (quotationId: number) => {
      const response = await apiRequest("DELETE", `/api/quotations/${quotationId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", "customer", customerId] });
      toast({
        title: "Quotation deleted",
        description: "The quotation has been successfully deleted.",
      });
      setQuotationToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quotation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Duplicate quotation mutation
  const duplicateQuotationMutation = useMutation({
    mutationFn: async (quotationId: number) => {
      const response = await apiRequest(
        "POST", 
        `/api/quotations/${quotationId}/duplicate`, 
        { customerId }
      );
      return response.json();
    },
    onSuccess: (newQuotation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", "customer", customerId] });
      toast({
        title: "Quotation duplicated",
        description: `A copy of the quotation has been created with ID #${newQuotation.id}.`,
      });
      setQuotationToDuplicate(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate quotation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteQuotation = () => {
    if (quotationToDelete) {
      deleteQuotationMutation.mutate(quotationToDelete.id);
    }
  };

  const handleDuplicateQuotation = () => {
    if (quotationToDuplicate) {
      duplicateQuotationMutation.mutate(quotationToDuplicate.id);
    }
  };

  const markCompleteMutation = useMutation({
    mutationFn: ({ followUpId, updateCustomerStage, newCustomerStage, completionNotes, nextFollowUpDate, nextFollowUpNotes }: { 
      followUpId: number, 
      updateCustomerStage?: boolean, 
      newCustomerStage?: string,
      completionNotes?: string,
      nextFollowUpDate?: Date | null,
      nextFollowUpNotes?: string
    }) => {
      setCompletingId(followUpId);
      return apiRequest("PUT", `/api/follow-ups/${followUpId}/complete`, {
        updateCustomerStage,
        newCustomerStage,
        completionNotes: nextFollowUpNotes,
        nextFollowUpDate,
        nextFollowUpNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Follow-up completed",
        description: updateStage 
          ? `Follow-up has been marked as complete and customer stage updated to ${newStage}.`
          : "Follow-up has been marked as complete.",
      });
      setCompletingId(null);
      setShowStageDialog(false);
      setSelectedFollowUpId(null);
      setUpdateStage(false);
      setNewStage(customer?.stage || null);
      setNextFollowUpDate(new Date());
      setNextFollowUpNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark follow-up as complete. Please try again.",
        variant: "destructive",
      });
      setCompletingId(null);
      setShowStageDialog(false);
      setSelectedFollowUpId(null);
      setNextFollowUpDate(new Date());
      setNextFollowUpNotes("");
    },
  });

  function onFollowUpSubmit(values: z.infer<typeof followUpFormSchema>) {
    followUpMutation.mutate(values);
  }

  function handleMarkComplete(followUpId: number) {
    setSelectedFollowUpId(followUpId);
    setShowStageDialog(true);
  }
  
  function confirmMarkComplete() {
    if (!selectedFollowUpId) return;
    
    markCompleteMutation.mutate({
      followUpId: selectedFollowUpId,
      updateCustomerStage: updateStage,
      newCustomerStage: updateStage ? newStage! : undefined,
      completionNotes: nextFollowUpNotes.trim() || undefined,
      nextFollowUpDate: (updateStage && newStage === "lost") ? null : nextFollowUpDate,
      nextFollowUpNotes: nextFollowUpNotes.trim() || undefined
    });
  }
  
  function cancelMarkComplete() {
    setShowStageDialog(false);
    setSelectedFollowUpId(null);
    setUpdateStage(false);
    setNewStage(customer?.stage || null);
    setNextFollowUpNotes("");
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
                  {(customer as any).notes ? (customer as any).notes : <span className="text-gray-400 italic">No notes available</span>}
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
            <TabsTrigger value="ledger" className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Ledger
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
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="updateCustomerStage"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Update Customer Stage</FormLabel>
                                <FormDescription>
                                  Change the customer's stage based on this follow-up interaction
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {form.watch("updateCustomerStage") && (
                          <FormField
                            control={form.control}
                            name="newCustomerStage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Customer Stage</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value || customer.stage}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a stage" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="pipeline">Pipeline</SelectItem>
                                    <SelectItem value="cold">Cold</SelectItem>
                                    <SelectItem value="warm">Warm</SelectItem>
                                    <SelectItem value="booked">Booked</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Current stage: <Badge variant="outline">{customer.stage}</Badge>
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      
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
                                {followUp.userName && (
                                  <div>Updated by: {followUp.userName}</div>
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
            
            {/* Complete Follow-up Dialog */}
            <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Complete Follow-up</DialogTitle>
                  <DialogDescription>
                    Mark this follow-up as complete and optionally update the customer stage.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                  {/* Update stage checkbox */}
                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox 
                      id="update-stage-checkbox"
                      checked={updateStage} 
                      onCheckedChange={(checked) => setUpdateStage(!!checked)} 
                    />
                    <div>
                      <label 
                        htmlFor="update-stage-checkbox" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Update Customer Stage
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Change the customer's stage based on this follow-up interaction
                      </p>
                    </div>
                  </div>
                  
                  {/* Stage selection */}
                  {updateStage && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">
                        New Customer Stage
                      </label>
                      <Select
                        value={newStage || customer.stage}
                        onValueChange={setNewStage}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="pipeline">Pipeline</SelectItem>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground flex items-center space-x-1 mt-1">
                        <Tag className="h-3 w-3" />
                        <span>Current stage: <Badge variant="outline" className="ml-1">{customer.stage}</Badge></span>
                      </p>
                      
                      {/* Note about lost customers */}
                      {newStage === "lost" && (
                        <p className="text-xs text-amber-600 mt-2">
                          Note: Next follow-up is optional for lost customers.
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Next follow-up date - hide if customer is marked as "lost" */}
                  {(!updateStage || newStage !== "lost") && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                          Next Follow-up Date
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`w-full justify-start text-left font-normal ${!nextFollowUpDate && "text-muted-foreground"}`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {nextFollowUpDate ? format(nextFollowUpDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={nextFollowUpDate || undefined} 
                              onSelect={(date) => {
                                if (date) {
                                  setNextFollowUpDate(date);
                                } else {
                                  setNextFollowUpDate(null);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      {/* Notes for completion and next follow-up */}
                      <div className="space-y-2 mt-4">
                        <label className="text-sm font-medium leading-none">
                          Notes
                        </label>
                        <Textarea
                          placeholder="Enter notes for this completion and the next follow-up"
                          value={nextFollowUpNotes}
                          onChange={(e) => setNextFollowUpNotes(e.target.value)}
                          className="resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <DialogFooter className="sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelMarkComplete}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={confirmMarkComplete}
                    disabled={markCompleteMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {markCompleteMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </div>
                    ) : (
                      "Complete Follow-up"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="ledger">
            <CustomerLedger customerId={customer.id} />
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
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                  </Button>
                                </Link>
                                <Link href={`/quotations/edit/${quotation.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setQuotationToDuplicate(quotation)}
                                  className="text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
                                >
                                  <Copy className="h-4 w-4" />
                                  <span className="sr-only">Duplicate</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setQuotationToDelete(quotation)}
                                  className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
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
        
        {/* Delete Quotation Dialog */}
        <AlertDialog open={!!quotationToDelete} onOpenChange={(open) => !open && setQuotationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this quotation? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteQuotation}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Duplicate Quotation Dialog */}
        <AlertDialog open={!!quotationToDuplicate} onOpenChange={(open) => !open && setQuotationToDuplicate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Duplicate Quotation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to create a copy of this quotation for this customer?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDuplicateQuotation}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Duplicate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}