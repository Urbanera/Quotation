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
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
  title?: string;
  description?: string;
  saveButtonText?: string;
  discardButtonText?: string;
}

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  title = "Unsaved Changes",
  description = "You have unsaved changes in your quotation. What would you like to do?",
  saveButtonText = "Save & Continue",
  discardButtonText = "Discard Changes"
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="outline"
            onClick={onDiscard}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-2" />
            {discardButtonText}
          </Button>
          <AlertDialogAction
            onClick={onSave}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}