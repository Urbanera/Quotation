import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Customer } from "@shared/schema";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";

interface CustomerStageFilterProps {
  customers: Customer[];
}

export default function CustomerStageFilter({ customers }: CustomerStageFilterProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Filter customers by stage
  const filteredCustomers = activeTab === "all" 
    ? customers 
    : customers.filter(customer => customer.stage === activeTab);

  // Count customers by stage
  const stageCounts = {
    all: customers.length,
    new: customers.filter(c => c.stage === "new").length,
    pipeline: customers.filter(c => c.stage === "pipeline").length,
    cold: customers.filter(c => c.stage === "cold").length,
    warm: customers.filter(c => c.stage === "warm").length,
    booked: customers.filter(c => c.stage === "booked").length,
  };

  // Stage color mapping for badges
  const stageColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    pipeline: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    cold: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    warm: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    booked: "bg-green-100 text-green-800 hover:bg-green-200",
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Customers by Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-6 mb-6">
            <TabsTrigger value="all" className="text-sm">
              All
              <Badge className="ml-2 bg-gray-100 text-gray-800">{stageCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="new" className="text-sm">
              New
              <Badge className="ml-2 bg-blue-100 text-blue-800">{stageCounts.new}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="text-sm">
              Pipeline
              <Badge className="ml-2 bg-purple-100 text-purple-800">{stageCounts.pipeline}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cold" className="text-sm">
              Cold
              <Badge className="ml-2 bg-gray-100 text-gray-800">{stageCounts.cold}</Badge>
            </TabsTrigger>
            <TabsTrigger value="warm" className="text-sm">
              Warm
              <Badge className="ml-2 bg-orange-100 text-orange-800">{stageCounts.warm}</Badge>
            </TabsTrigger>
            <TabsTrigger value="booked" className="text-sm">
              Booked
              <Badge className="ml-2 bg-green-100 text-green-800">{stageCounts.booked}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
                      <CardTitle className="text-base font-medium truncate">
                        {customer.name}
                      </CardTitle>
                      <Badge className={stageColors[customer.stage || "new"] || ""}>
                        {customer.stage ? customer.stage.charAt(0).toUpperCase() + customer.stage.slice(1) : "New"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-500">Email: </span>
                        {customer.email}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-500">Phone: </span>
                        {customer.phone}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-500">Added: </span>
                        {formatDate(customer.createdAt)}
                      </div>
                      <div className="pt-3 flex justify-end">
                        <Link href={`/customers/${customer.id}`}>
                          <Button size="sm" variant="outline">View Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No customers found in this stage.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}