import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  History, 
  RotateCcw, 
  Clock, 
  FileText, 
  ArrowRight, 
  AlertCircle,
  ChevronDown,
  ChevronRight 
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QuotationModification } from "@shared/schema";

interface QuotationModificationHistoryProps {
  quotationId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function QuotationModificationHistory({ 
  quotationId, 
  isOpen, 
  onClose 
}: QuotationModificationHistoryProps) {
  const { toast } = useToast();
  const [selectedModification, setSelectedModification] = useState<QuotationModification | null>(null);
  const [expandedModifications, setExpandedModifications] = useState<Set<number>>(new Set());

  const { data: modifications = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/quotations/${quotationId}/modifications`],
    enabled: isOpen
  });

  const revertMutation = useMutation({
    mutationFn: async (modificationId: number) => {
      const response = await apiRequest("POST", `/api/quotations/${quotationId}/revert/${modificationId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation has been reverted to the selected modification",
      });
      // Invalidate quotation data to refresh the UI
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/details`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/modifications`] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revert quotation",
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  const handleRevert = (modification: QuotationModification) => {
    setSelectedModification(modification);
  };

  const confirmRevert = () => {
    if (selectedModification) {
      revertMutation.mutate(selectedModification.id);
      setSelectedModification(null);
    }
  };

  const toggleExpansion = (modificationId: number) => {
    setExpandedModifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modificationId)) {
        newSet.delete(modificationId);
      } else {
        newSet.add(modificationId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Quotation Modification History
          </DialogTitle>
          <DialogDescription>
            View and revert to previous versions of this quotation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2">Loading modification history...</span>
            </div>
          ) : modifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText className="h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No modifications found</p>
              <p className="text-sm">Changes will appear here once you start editing the quotation</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-2 p-4">
                {modifications.map((modification, index) => {
                  const isExpanded = expandedModifications.has(modification.id);
                  return (
                    <div key={modification.id} className="border rounded-lg border-l-4 border-l-indigo-500">
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={() => toggleExpansion(modification.id)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <Badge variant="outline" className="text-xs">
                                  #{modification.modificationNumber}
                                </Badge>
                              </div>
                              <span className="font-medium">{modification.title}</span>
                              <span className="text-sm text-gray-500">
                                {formatCurrency(modification.finalPrice)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                {formatDate(modification.createdAt)}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRevert(modification);
                                }}
                                disabled={revertMutation.isPending}
                                className="ml-2"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Revert
                              </Button>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-3 pb-3 border-t">
                            <div className="pt-3">
                              {modification.description && (
                                <p className="text-sm text-gray-600 mb-3">{modification.description}</p>
                              )}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Total Selling Price:</span>
                                  <span className="font-medium">
                                    {formatCurrency(modification.totalSellingPrice)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Final Price:</span>
                                  <span className="font-medium">
                                    {formatCurrency(modification.finalPrice)}
                                  </span>
                                </div>
                              </div>
                              
                              {index < modifications.length - 1 && (
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t text-sm text-gray-500">
                                  <ArrowRight className="h-4 w-4" />
                                  <span>
                                    Price changed from {formatCurrency(modification.finalPrice)} to{" "}
                                    {formatCurrency(modifications[index + 1].finalPrice)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Revert Confirmation Dialog */}
        <AlertDialog open={selectedModification !== null} onOpenChange={() => setSelectedModification(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Confirm Revert
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revert the quotation to modification{" "}
                <strong>#{selectedModification?.modificationNumber}</strong>?
                <br />
                <br />
                <strong>"{selectedModification?.title}"</strong>
                <br />
                <br />
                This action will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Save the current state as a new modification</li>
                  <li>Restore all rooms, products, and pricing from the selected modification</li>
                  <li>Cannot be undone except by reverting to another modification</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={revertMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRevert}
                disabled={revertMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {revertMutation.isPending ? "Reverting..." : "Revert Quotation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}