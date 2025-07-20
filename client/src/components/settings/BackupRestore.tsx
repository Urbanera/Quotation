import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  FileText, 
  Database,
  Loader2,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface BackupRestoreResult {
  message: string;
  results: {
    restored: {
      companySettings: number;
      appSettings: number;
      users: number;
      userPermissions: number;
      customers: number;
      quotations: number;
      invoices: number;
      payments: number;
      followUps: number;
      accessoryCatalog: number;
      teams: number;
      milestones: number;
    };
    errors: string[];
    skipped: string[];
  };
  backupInfo: {
    exportDate: string;
    version: string;
  };
}

export default function BackupRestore() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [restoreResult, setRestoreResult] = useState<BackupRestoreResult | null>(null);

  // Export backup mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/backup/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Backup file has been downloaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: `Failed to export backup: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Import backup mutation
  const importMutation = useMutation<BackupRestoreResult, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }

      return response.json();
    },
    onSuccess: (result) => {
      setRestoreResult(result);
      setShowResultDialog(true);
      setShowRestoreDialog(false);
      
      const totalRestored = Object.values(result.results.restored).reduce((sum, count) => sum + count, 0);
      
      toast({
        title: "Backup Restored",
        description: `Successfully restored ${totalRestored} items from backup`,
      });
    },
    onError: (error: Error) => {
      setShowRestoreDialog(false);
      toast({
        title: "Restore Failed",
        description: `Failed to restore backup: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid file",
        description: "Please select a JSON backup file",
        variant: "destructive",
      });
      return;
    }

    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    importMutation.mutate(file);
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Application Data
          </CardTitle>
          <CardDescription>
            Download a complete backup of all your application data including customers, quotations, 
            invoices, settings, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-4 rounded-md border p-4">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">What's included in the backup:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Company settings and application configuration</li>
                <li>• Customer information and contact details</li>
                <li>• Quotations, invoices, and payment records</li>
                <li>• Accessory catalog and inventory data</li>
                <li>• Follow-up records and customer interactions</li>
                <li>• Teams and project milestones</li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">
                Note: User passwords are not included for security reasons.
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleExport} 
            disabled={exportMutation.isPending}
            className="w-full sm:w-auto"
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restore Application Data
          </CardTitle>
          <CardDescription>
            Upload a backup file to restore your application data. This will replace existing data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-4 rounded-md border border-orange-200 bg-orange-50 p-4">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-orange-800">Important Warning</p>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• This will replace your existing data</li>
                <li>• Users and permissions are not restored for security</li>
                <li>• Create a current backup before restoring</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="backup-file" className="text-sm font-medium">
              Select Backup File
            </label>
            <Input 
              id="backup-file"
              ref={fileInputRef}
              type="file" 
              accept=".json"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Data Restore
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to restore from this backup file?</p>
              <p className="font-medium text-orange-600">
                This will replace your existing data and cannot be undone.
              </p>
              <p className="text-sm">
                Make sure you have a current backup before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetFileInput}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              disabled={importMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Yes, Restore Data"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Restore Complete
            </DialogTitle>
            <DialogDescription>
              Your backup has been processed. Here are the results:
            </DialogDescription>
          </DialogHeader>
          
          {restoreResult && (
            <div className="space-y-4">
              {/* Backup Info */}
              <div className="rounded-md bg-blue-50 p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Backup Information</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>Export Date: {new Date(restoreResult.backupInfo.exportDate).toLocaleString()}</p>
                  <p>Backup Version: {restoreResult.backupInfo.version}</p>
                </div>
              </div>

              {/* Restored Items */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Items Restored:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(restoreResult.results.restored).map(([key, count]) => (
                    count > 0 && (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Skipped Items */}
              {restoreResult.results.skipped.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-orange-600">Skipped:</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {restoreResult.results.skipped.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {restoreResult.results.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-600">Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {restoreResult.results.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}