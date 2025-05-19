import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Customer, FollowUp } from "@shared/schema";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  X 
} from "lucide-react";

interface CustomerStageFilterProps {
  customers: Customer[];
}

// Define the available stages
const STAGES = ["new", "pipeline", "cold", "warm", "booked", "lost"] as const;
type Stage = (typeof STAGES)[number];

export default function CustomerStageFilter({ customers }: CustomerStageFilterProps) {
  // Track filters in state
  const [selectedStages, setSelectedStages] = useState<Stage[]>([]);
  const [selectedLeadSources, setSelectedLeadSources] = useState<string[]>([]);
  const [followUpFilter, setFollowUpFilter] = useState<"all" | "pending" | "completed">("all");
  const [activeTab, setActiveTab] = useState("stages");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get all follow-ups to determine customer follow-up status
  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups/all"],
  });
  
  // Get app settings to retrieve lead source options
  const { data: appSettings } = useQuery({
    queryKey: ["/api/settings/app"],
  });

  // Extract unique lead sources from both customers and settings
  const [availableLeadSources, setAvailableLeadSources] = useState<string[]>([]);

  useEffect(() => {
    const leadSourcesFromSettings = appSettings?.leadSourceOptions 
      ? appSettings.leadSourceOptions.split(',').map(s => s.trim()) 
      : [];
      
    const leadSourcesFromCustomers = customers
      .filter(c => c.leadSource)
      .map(c => c.leadSource as string);
      
    const uniqueSources = Array.from(new Set([...leadSourcesFromSettings, ...leadSourcesFromCustomers]))
      .filter(Boolean) as string[];
      
    setAvailableLeadSources(uniqueSources);
  }, [customers, appSettings]);

  // Helper to determine if a customer has pending follow-ups
  const hasPendingFollowUp = (customerId: number): boolean => {
    return followUps.some(followUp => 
      followUp.customerId === customerId && 
      !followUp.completed && 
      followUp.nextFollowUpDate && 
      new Date(followUp.nextFollowUpDate) >= new Date()
    );
  };

  // Helper to determine if a customer has completed follow-ups
  const hasCompletedFollowUp = (customerId: number): boolean => {
    return followUps.some(followUp => 
      followUp.customerId === customerId && 
      followUp.completed
    );
  };

  // Apply all filters to customers
  const filteredCustomers = customers.filter(customer => {
    // Only filter by stage if there are selected stages
    // When using multiple stages, show customers that match ANY of the selected stages (not ALL)
    const stageMatch = selectedStages.length === 0 || 
      (customer.stage && selectedStages.includes(customer.stage as Stage));
    
    // Filter by lead source - only if there are selected lead sources
    const leadSourceMatch = selectedLeadSources.length === 0 || 
      (customer.leadSource && selectedLeadSources.includes(customer.leadSource));
    
    // Filter by follow-up status
    let followUpMatch = true;
    if (followUpFilter === "pending") {
      followUpMatch = hasPendingFollowUp(customer.id);
    } else if (followUpFilter === "completed") {
      followUpMatch = hasCompletedFollowUp(customer.id);
    }
    
    return stageMatch && leadSourceMatch && followUpMatch;
  });

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

  // Count customers by lead source
  const leadSourceCounts = availableLeadSources.reduce((acc, source) => {
    acc[source] = customers.filter(c => c.leadSource === source).length;
    return acc;
  }, {} as Record<string, number>);

  // Count customers by follow-up status
  const followUpCounts = {
    pending: customers.filter(c => hasPendingFollowUp(c.id)).length,
    completed: customers.filter(c => hasCompletedFollowUp(c.id)).length,
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

  // Lead source color for badges (consistent blue)
  const leadSourceColor = "bg-sky-100 text-sky-800 hover:bg-sky-200";

  // Follow-up status colors
  const followUpColors = {
    pending: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    completed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  };

  // Handle stage checkbox changes
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

  // Handle lead source checkbox changes
  const handleLeadSourceToggle = (source: string) => {
    setSelectedLeadSources(prev => {
      if (prev.includes(source)) {
        // Remove source if already selected
        return prev.filter(s => s !== source);
      } else {
        // Add source if not selected
        return [...prev, source];
      }
    });
  };

  // Clear all selected filters
  const clearFilters = () => {
    setSelectedStages([]);
    setSelectedLeadSources([]);
    setFollowUpFilter("all");
  };

  // Check if any filters are applied
  const hasFilters = selectedStages.length > 0 || 
    selectedLeadSources.length > 0 || 
    followUpFilter !== "all";

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Customers</CardTitle>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters} 
                className="text-gray-500 hover:text-gray-700 flex gap-1 items-center"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
            <Button
              variant={isFilterOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex gap-1 items-center"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasFilters && (
                <Badge className="ml-1 bg-indigo-100 text-indigo-800">
                  {selectedStages.length + selectedLeadSources.length + (followUpFilter !== "all" ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isFilterOpen && (
        <CardContent className="border-b pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="stages">Stages</TabsTrigger>
              <TabsTrigger value="sources">Lead Sources</TabsTrigger>
              <TabsTrigger value="followups">Follow-ups</TabsTrigger>
            </TabsList>
            
            {/* Stages Filter Tab */}
            <TabsContent value="stages" className="mt-4">
              <div className="flex flex-wrap gap-2">
                {STAGES.map((stage) => {
                  const isSelected = selectedStages.includes(stage);
                  let bgColorClass = '';
                  
                  if (isSelected) {
                    switch (stage) {
                      case 'new': bgColorClass = 'bg-blue-100 border-blue-300'; break;
                      case 'pipeline': bgColorClass = 'bg-purple-100 border-purple-300'; break;
                      case 'cold': bgColorClass = 'bg-gray-100 border-gray-300'; break;
                      case 'warm': bgColorClass = 'bg-orange-100 border-orange-300'; break;
                      case 'booked': bgColorClass = 'bg-green-100 border-green-300'; break;
                      case 'lost': bgColorClass = 'bg-red-100 border-red-300'; break;
                      default: bgColorClass = 'bg-white';
                    }
                  }
                  
                  return (
                    <div 
                      key={stage} 
                      className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer ${isSelected ? bgColorClass : 'bg-white'}`}
                      onClick={() => {
                        // Simple toggle logic
                        if (isSelected) {
                          // If already selected, remove it
                          setSelectedStages(selectedStages.filter(s => s !== stage));
                        } else {
                          // If not selected, add it
                          setSelectedStages([...selectedStages, stage]);
                        }
                      }}
                    >
                      <div className={`w-4 h-4 rounded border ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'} flex items-center justify-center`}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium cursor-pointer">
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </span>
                      <Badge className={`ml-1 ${stageColors[stage]}`}>
                        {stageCounts[stage]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            {/* Lead Sources Filter Tab */}
            <TabsContent value="sources" className="mt-4">
              {availableLeadSources.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableLeadSources.map((source) => (
                    <div 
                      key={source} 
                      className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer ${
                        selectedLeadSources.includes(source) 
                          ? 'bg-sky-100 border-sky-300'
                          : 'bg-white'
                      }`}
                      onClick={() => handleLeadSourceToggle(source)}
                    >
                      <Checkbox 
                        id={`source-${source}`} 
                        checked={selectedLeadSources.includes(source)}
                        onCheckedChange={() => handleLeadSourceToggle(source)}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      <label 
                        htmlFor={`source-${source}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </label>
                      <Badge className={`ml-2 ${leadSourceColor}`}>
                        {leadSourceCounts[source] || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No lead sources found. Add lead sources in settings or assign them to customers.
                </div>
              )}
            </TabsContent>
            
            {/* Follow-ups Filter Tab */}
            <TabsContent value="followups" className="mt-4">
              <div className="flex flex-wrap gap-2">
                <div 
                  className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer ${
                    followUpFilter === "all" 
                      ? 'bg-indigo-100 border-indigo-300'
                      : 'bg-white'
                  }`}
                  onClick={() => setFollowUpFilter("all")}
                >
                  <Checkbox 
                    id="followup-all" 
                    checked={followUpFilter === "all"}
                    onCheckedChange={() => setFollowUpFilter("all")}
                    className="data-[state=checked]:bg-indigo-600"
                  />
                  <label 
                    htmlFor="followup-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    All
                  </label>
                  <Clock className="ml-2 h-4 w-4 text-gray-500" />
                </div>
                
                <div 
                  className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer ${
                    followUpFilter === "pending" 
                      ? 'bg-amber-100 border-amber-300'
                      : 'bg-white'
                  }`}
                  onClick={() => setFollowUpFilter(followUpFilter === "pending" ? "all" : "pending")}
                >
                  <Checkbox 
                    id="followup-pending" 
                    checked={followUpFilter === "pending"}
                    onCheckedChange={() => setFollowUpFilter(followUpFilter === "pending" ? "all" : "pending")}
                    className="data-[state=checked]:bg-indigo-600"
                  />
                  <label 
                    htmlFor="followup-pending"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Pending Follow-ups
                  </label>
                  <Badge className={`ml-2 ${followUpColors.pending}`}>
                    {followUpCounts.pending}
                  </Badge>
                </div>
                
                <div 
                  className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer ${
                    followUpFilter === "completed" 
                      ? 'bg-emerald-100 border-emerald-300'
                      : 'bg-white'
                  }`}
                  onClick={() => setFollowUpFilter(followUpFilter === "completed" ? "all" : "completed")}
                >
                  <Checkbox 
                    id="followup-completed" 
                    checked={followUpFilter === "completed"}
                    onCheckedChange={() => setFollowUpFilter(followUpFilter === "completed" ? "all" : "completed")}
                    className="data-[state=checked]:bg-indigo-600"
                  />
                  <label 
                    htmlFor="followup-completed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Completed Follow-ups
                  </label>
                  <Badge className={`ml-2 ${followUpColors.completed}`}>
                    {followUpCounts.completed}
                  </Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Active Filters Display */}
          {hasFilters && (
            <div className="flex gap-1 flex-wrap mt-4 items-center">
              <span className="text-sm text-gray-500">Filtering by:</span>
              
              {selectedStages.map(stage => (
                <Badge 
                  key={`selected-${stage}`} 
                  className={`${stageColors[stage]} flex items-center gap-1`}
                  onClick={() => handleStageToggle(stage)}
                >
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              
              {selectedLeadSources.map(source => (
                <Badge 
                  key={`selected-${source}`} 
                  className={`${leadSourceColor} flex items-center gap-1`}
                  onClick={() => handleLeadSourceToggle(source)}
                >
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              
              {followUpFilter !== "all" && (
                <Badge 
                  className={`${followUpColors[followUpFilter]} flex items-center gap-1`}
                  onClick={() => setFollowUpFilter("all")}
                >
                  {followUpFilter === "pending" ? "Pending Follow-ups" : "Completed Follow-ups"}
                  <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      )}
      <CardContent className="pt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
                  <CardTitle className="text-base font-medium truncate">
                    {customer.name}
                  </CardTitle>
                  <div className="flex space-x-1">
                    {hasPendingFollowUp(customer.id) && (
                      <AlertCircle className="h-4 w-4 text-amber-500" title="Has pending follow-ups" />
                    )}
                    <Badge className={stageColors[customer.stage || "new"] || ""}>
                      {customer.stage ? customer.stage.charAt(0).toUpperCase() + customer.stage.slice(1) : "New"}
                    </Badge>
                  </div>
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
                  {customer.leadSource && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-500">Source: </span>
                      <Badge variant="outline" className="font-normal">
                        {customer.leadSource}
                      </Badge>
                    </div>
                  )}
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
              {hasFilters
                ? "No customers match your selected filters." 
                : "No customers found."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}