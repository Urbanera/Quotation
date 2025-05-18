import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Customer } from "@shared/schema";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";

interface CustomerStageFilterProps {
  customers: Customer[];
}

// Define the available stages
const STAGES = ["new", "pipeline", "cold", "warm", "booked", "lost"] as const;
type Stage = (typeof STAGES)[number];

export default function CustomerStageFilter({ customers }: CustomerStageFilterProps) {
  // Track selected stages in an array
  const [selectedStages, setSelectedStages] = useState<Stage[]>([]);

  // Filter customers by selected stages
  const filteredCustomers = selectedStages.length === 0
    ? customers // If no stages selected, show all
    : customers.filter(customer => selectedStages.includes(customer.stage as Stage));

  // Filter out lost customers for the total count
  const activeCustomers = customers.filter(c => c.stage !== "lost");

  // Count customers by stage
  const stageCounts = {
    all: activeCustomers.length,
    new: customers.filter(c => c.stage === "new").length,
    pipeline: customers.filter(c => c.stage === "pipeline").length,
    cold: customers.filter(c => c.stage === "cold").length,
    warm: customers.filter(c => c.stage === "warm").length,
    booked: customers.filter(c => c.stage === "booked").length,
    lost: customers.filter(c => c.stage === "lost").length,
  };

  // Stage color mapping for badges
  const stageColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    pipeline: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    cold: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    warm: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    booked: "bg-green-100 text-green-800 hover:bg-green-200",
    lost: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  // Handle checkbox changes
  const handleStageToggle = (stage: Stage) => {
    setSelectedStages(prev => {
      if (prev.includes(stage)) {
        // Remove stage if already selected
        return prev.filter(s => s !== stage);
      } else {
        // Add stage if not selected
        return [...prev, stage];
      }
    });
  };

  // Clear all selected filters
  const clearFilters = () => {
    setSelectedStages([]);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Customers by Stage</CardTitle>
          {selectedStages.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters} 
              className="text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {STAGES.map((stage) => (
              <div 
                key={stage} 
                className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer ${
                  selectedStages.includes(stage) 
                    ? (stage === 'new' 
                        ? 'bg-blue-100 border-blue-300' 
                        : stage === 'pipeline' 
                          ? 'bg-purple-100 border-purple-300' 
                          : stage === 'cold' 
                            ? 'bg-gray-100 border-gray-300' 
                            : stage === 'warm' 
                              ? 'bg-orange-100 border-orange-300' 
                              : stage === 'booked' 
                                ? 'bg-green-100 border-green-300' 
                                : 'bg-red-100 border-red-300')
                    : 'bg-white'
                }`}
                onClick={() => handleStageToggle(stage)}
              >
                <Checkbox 
                  id={`stage-${stage}`} 
                  checked={selectedStages.includes(stage)}
                  onCheckedChange={() => handleStageToggle(stage)}
                  className="data-[state=checked]:bg-indigo-600"
                />
                <label 
                  htmlFor={`stage-${stage}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </label>
                <Badge className={`ml-2 ${stageColors[stage]}`}>
                  {stageCounts[stage]}
                </Badge>
              </div>
            ))}
          </div>

          {selectedStages.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              <span className="text-sm text-gray-500">Filtering by:</span>
              {selectedStages.map(stage => (
                <Badge 
                  key={stage} 
                  className={stageColors[stage]}
                  onClick={() => handleStageToggle(stage)}
                >
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </Badge>
              ))}
            </div>
          )}
        </div>

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
                    <Link href={`/customers/view/${customer.id}`}>
                      <Button size="sm" variant="outline">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              {selectedStages.length > 0 
                ? "No customers found with the selected stages." 
                : "No customers found."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}