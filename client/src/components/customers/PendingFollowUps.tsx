import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { FollowUp, Customer } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Bell, CheckCircle2, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PendingFollowUp = FollowUp & { 
  customer: Customer;
  userName?: string;
  userUsername?: string;
};

export default function PendingFollowUps() {
  const { toast } = useToast();
  const [completingId, setCompletingId] = useState<number | null>(null);

  const { 
    data: pendingFollowUps, 
    isLoading 
  } = useQuery<PendingFollowUp[]>({
    queryKey: ["/api/follow-ups/pending"],
  });

  const markCompleteMutation = useMutation({
    mutationFn: (followUpId: number) => {
      setCompletingId(followUpId);
      return apiRequest("PUT", `/api/follow-ups/${followUpId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups/pending"] });
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

  function handleMarkComplete(followUpId: number) {
    markCompleteMutation.mutate(followUpId);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Bell className="mr-2 h-5 w-5 text-amber-500" />
            Pending Follow-ups
          </CardTitle>
          <CardDescription>
            Follow-ups that require your attention
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-500">Loading follow-ups...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pendingFollowUps?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Bell className="mr-2 h-5 w-5 text-amber-500" />
            Pending Follow-ups
          </CardTitle>
          <CardDescription>
            You're all caught up!
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-center py-4">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="text-gray-500">No pending follow-ups at the moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Bell className="mr-2 h-5 w-5 text-amber-500" />
          Pending Follow-ups
        </CardTitle>
        <CardDescription>
          {pendingFollowUps.length} follow-up{pendingFollowUps.length !== 1 ? 's' : ''} requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          {pendingFollowUps.slice(0, 3).map((followUp) => (
            <div key={followUp.id} className="border rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <Link href={`/customers/view/${followUp.customerId}`}>
                  <a className="font-medium text-indigo-600 hover:text-indigo-700">
                    {followUp.customer.name}
                  </a>
                </Link>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Clock className="mr-1 h-3 w-3" />
                  Due
                </Badge>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{followUp.notes}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Follow-up date: {format(new Date(followUp.nextFollowUpDate!), 'MMM d, yyyy')}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleMarkComplete(followUp.id)}
                  disabled={markCompleteMutation.isPending && completingId === followUp.id}
                >
                  {markCompleteMutation.isPending && completingId === followUp.id ? (
                    <span className="flex items-center">
                      <div className="animate-spin h-3 w-3 mr-2 border-b-2 border-current"></div>
                      Marking...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Complete
                    </span>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {pendingFollowUps.length > 3 && (
        <CardFooter className="pt-0 px-6">
          <Button variant="link" className="w-full text-indigo-600 hover:text-indigo-700">
            View all {pendingFollowUps.length} follow-ups
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}