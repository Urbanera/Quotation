import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, CalendarDays, Clock, CheckCircle2, AlertTriangle, MoreVertical, Plus } from "lucide-react";
import { format } from "date-fns";
import { Milestone } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import MilestoneDialog from "./MilestoneDialog";

type ProjectTimelineProps = {
  quotationId: number;
};

export function ProjectTimeline({ quotationId }: ProjectTimelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const { data: milestones = [], isLoading, isError } = useQuery<Milestone[]>({
    queryKey: [`/api/quotations/${quotationId}/milestones`],
    enabled: !!quotationId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/milestones/${id}/status`, { 
        status,
        completedDate: status === "completed" ? new Date().toISOString() : null
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/quotations/${quotationId}/milestones`],
      });
      toast({
        title: "Status updated",
        description: "The milestone status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update milestone status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/milestones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/quotations/${quotationId}/milestones`],
      });
      toast({
        title: "Milestone deleted",
        description: "The milestone has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete milestone. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "pending":
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Pending</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-700">Completed</Badge>;
      case "delayed":
        return <Badge variant="outline" className="bg-amber-100 text-amber-700">Delayed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case "pending":
        return <Clock className="h-5 w-5 text-gray-500" />;
      case "in_progress":
        return <ChevronRight className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "delayed":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleAddMilestone = () => {
    setSelectedMilestone(null);
    setDialogOpen(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setDialogOpen(true);
  };

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDeleteMilestone = (id: number) => {
    if (confirm("Are you sure you want to delete this milestone? This action cannot be undone.")) {
      deleteMilestoneMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full py-10 text-center">
        <p className="text-red-500">Failed to load project timeline. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="project-timeline w-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">Project Timeline</h3>
          <p className="text-gray-500 text-sm">Track the progress of your project milestones</p>
        </div>
        <Button onClick={handleAddMilestone} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <Card className="w-full border border-dashed">
          <CardContent className="pt-6 pb-8 text-center">
            <p className="text-gray-500 mb-4">No milestones have been added to this project yet.</p>
            <Button 
              variant="outline" 
              onClick={handleAddMilestone}
              className="mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first milestone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {milestones.map((milestone, index) => (
            <Card key={milestone.id} className="w-full border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-2">
                    <div className="mt-1">{getStatusIcon(milestone.status)}</div>
                    <div>
                      <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {milestone.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(milestone.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditMilestone(milestone)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(milestone.id, "pending")}>
                          Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(milestone.id, "in_progress")}>
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(milestone.id, "completed")}>
                          Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(milestone.id, "delayed")}>
                          Mark as Delayed
                        </DropdownMenuItem>
                        <Separator className="my-1" />
                        <DropdownMenuItem 
                          className="text-red-600 focus:bg-red-50 focus:text-red-700" 
                          onClick={() => handleDeleteMilestone(milestone.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 mt-1">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{format(new Date(milestone.startDate), 'MMM d, yyyy')} - {format(new Date(milestone.endDate), 'MMM d, yyyy')}</span>
                  </div>
                  {milestone.completedDate && (
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                      <span>Completed on {format(new Date(milestone.completedDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              {index < milestones.length - 1 && (
                <div className="mx-6 mb-2">
                  <div className="border-l-2 border-dashed border-gray-300 h-6 ml-[10px]"></div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <MilestoneDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        quotationId={quotationId} 
        milestone={selectedMilestone} 
      />
    </div>
  );
}

// Default export
export default ProjectTimeline;
