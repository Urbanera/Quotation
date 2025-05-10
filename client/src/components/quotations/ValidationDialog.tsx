import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { ValidationError, ValidationWarning } from '@/lib/quotationValidation';

interface ValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  onProceed?: () => void;
  onCancel: () => void;
  quotationId: number;
}

export function ValidationDialog({
  open,
  onOpenChange,
  errors,
  warnings,
  onProceed,
  onCancel,
  quotationId
}: ValidationDialogProps) {
  const [, navigate] = useLocation();

  const handleGoToRoom = (roomId: number) => {
    onOpenChange(false);
    navigate(`/quotations/edit/${quotationId}?roomId=${roomId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {errors.length > 0 
              ? "Quotation Validation Errors" 
              : "Quotation Validation Warnings"}
          </DialogTitle>
          <DialogDescription>
            {errors.length > 0 
              ? "Please fix the following errors before saving the quotation:" 
              : "Please review the following warnings before proceeding:"}
          </DialogDescription>
        </DialogHeader>

        {/* Error List */}
        {errors.length > 0 && (
          <div className="space-y-3 my-2">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700">{error.message}</p>
                  {error.roomId && (
                    <Button 
                      variant="link" 
                      className="text-red-600 p-0 h-auto text-xs mt-1"
                      onClick={() => handleGoToRoom(error.roomId as number)}
                    >
                      Go to this room
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Warning List */}
        {errors.length === 0 && warnings.length > 0 && (
          <div className="space-y-3 my-2">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700">{warning.message}</p>
                  {warning.type === 'check_accessories' && warning.accessories.length > 0 && (
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {warning.accessories.map((accessory, i) => (
                        <li key={i} className="text-sm text-amber-600">
                          {accessory.charAt(0).toUpperCase() + accessory.slice(1)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          {errors.length === 0 && onProceed && (
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={onProceed}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Proceed with Saving
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}