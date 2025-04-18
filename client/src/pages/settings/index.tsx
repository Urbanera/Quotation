import { CompanySettingsForm } from "@/components/settings/CompanySettings";
import { AppSettingsForm } from "@/components/settings/AppSettings";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="container py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and company information
        </p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="company">Company Information</TabsTrigger>
          <TabsTrigger value="quotation">Quotation Defaults</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="space-y-6">
          <CompanySettingsForm />
        </TabsContent>
        
        <TabsContent value="quotation" className="space-y-6">
          <AppSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
