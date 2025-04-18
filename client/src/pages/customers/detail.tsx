import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { 
  ChevronLeft, 
  Edit, 
  ChevronRight, 
  Plus,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Customer, FollowUp, Quotation } from "@shared/schema";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const followUpFormSchema = z.object({
  customerId: z.number(),
  notes: z.string().min(1, "Notes are required"),
  interactionDate: z.string(),
  nextFollowUpDate: z.string().optional(),
  completed: z.boolean().default(false),
});

export default function CustomerDetailPage() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id);
  const { toast } = useToast();
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);

  // Query customer details
  const { 
    data: customer, 
    isLoading: isCustomerLoading,
    error: customerError
  } = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
    enabled: !isNaN(customerId),
  });

  // Query customer follow-ups
  const { 
    data: followUps, 
    isLoading: isFollowUpsLoading 
  } = useQuery<FollowUp[]>({
    queryKey: [`/api/customers/${customerId}/follow-ups`],
    enabled: !isNaN(customerId),
  });

  // Query customer quotations
  const { 
    data: quotations, 
    isLoading: isQuotationsLoading 
  } = useQuery<Quotation[]>({
    queryKey: [`/api/customers/${customerId}/quotations`],
    enabled: !isNaN(customerId),
  });

  // Create follow-up mutation
  const createFollowUpMutation = useMutation({
    mutationFn: (followUpData: z.infer<typeof followUpFormSchema>) => {
      return apiRequest("POST", "/api/follow-ups", followUpData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/follow-ups`] });
      toast({
        title: "Follow-up created",
        description: "The follow-up has been added successfully.",
      });
      setIsFollowUpDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create follow-up. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark follow-up as complete mutation
  const markCompleteFollowUpMutation = useMutation({
    mutationFn: (followUpId: number) => {
      return apiRequest("PUT", `/api/follow-ups/${followUpId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}/follow-ups`] });
      toast({
        title: "Follow-up completed",
        description: "The follow-up has been marked as complete.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark follow-up as complete. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Setup form
  const form = useForm<z.infer<typeof followUpFormSchema>>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      customerId: customerId,
      notes: "",
      interactionDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate: "",
      completed: false,
    },
  });

  function onFollowUpSubmit(values: z.infer<typeof followUpFormSchema>) {
    createFollowUpMutation.mutate(values);
  }

  function handleMarkComplete(followUpId: number) {
    markCompleteFollowUpMutation.mutate(followUpId);
  }

  // Show loading state
  if (isCustomerLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading customer details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (customerError || !customer) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-8">
            <p className="text-red-500">Error loading customer data. Please try again.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/customers")}
              className="mt-4"
            >
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <Button
              variant="ghost"
              onClick={() => navigate("/customers")}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Customer Details</h1>
          </div>
          <div className="flex space-x-3">
            <Link href={`/customers/edit/${customer.id}`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Customer
              </Button>
            </Link>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{customer.name}</h2>
            <p className="text-sm text-gray-500">Customer ID: {customer.id}</p>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{customer.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1">{customer.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start col-span-1 md:col-span-2">
                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1">{customer.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Follow-Ups and Quotations */}
        <Tabs defaultValue="follow-ups" className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
              <TabsTrigger value="quotations">Quotations</TabsTrigger>
            </TabsList>
          </div>

          {/* Follow-ups Tab */}
          <TabsContent value="follow-ups" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Customer Follow-ups</h3>
              <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Follow-up
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Follow-up</DialogTitle>
                    <DialogDescription>
                      Record your interaction with the customer and set a reminder for the next follow-up if needed.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onFollowUpSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter details of your interaction" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="interactionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interaction Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="nextFollowUpDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next Follow-up Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={createFollowUpMutation.isPending}
                        >
                          {createFollowUpMutation.isPending ? "Saving..." : "Save Follow-up"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {isFollowUpsLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading follow-ups...</p>
              </div>
            ) : !followUps?.length ? (
              <div className="text-center py-12 border rounded-md">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No follow-ups recorded yet.</p>
                <Button onClick={() => setIsFollowUpDialogOpen(true)}>
                  Add Your First Follow-up
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {followUps.map((followUp) => (
                  <Card key={followUp.id} className={followUp.completed ? "bg-gray-50 border-gray-200" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-medium flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(followUp.interactionDate).toLocaleDateString()}
                          </CardTitle>
                          {followUp.nextFollowUpDate && (
                            <CardDescription>
                              Next follow-up: {new Date(followUp.nextFollowUpDate).toLocaleDateString()}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant={followUp.completed ? "outline" : "default"}>
                          {followUp.completed ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{followUp.notes}</p>
                    </CardContent>
                    {!followUp.completed && (
                      <CardFooter className="pt-0 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkComplete(followUp.id)}
                          disabled={markCompleteFollowUpMutation.isPending}
                        >
                          Mark as Complete
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quotations Tab */}
          <TabsContent value="quotations" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Customer Quotations</h3>
              <Link href={`/quotations/create?customerId=${customer.id}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Quotation
                </Button>
              </Link>
            </div>
            
            {isQuotationsLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading quotations...</p>
              </div>
            ) : !quotations?.length ? (
              <div className="text-center py-12 border rounded-md">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No quotations created yet.</p>
                <Link href={`/quotations/create?customerId=${customer.id}`}>
                  <Button>
                    Create First Quotation
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {quotations.map((quotation) => (
                  <Card key={quotation.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-medium">
                          Quotation #{quotation.id}
                        </CardTitle>
                        <Badge variant="outline">
                          {new Date(quotation.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <p className="text-sm text-gray-500">Total Price</p>
                          <p className="font-medium">${quotation.finalPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created</p>
                          <p className="font-medium">{format(new Date(quotation.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Link href={`/quotations/view/${quotation.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}