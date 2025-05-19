import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Define available stages
const STAGES = ["new", "pipeline", "cold", "warm", "booked", "lost"] as const;
type Stage = (typeof STAGES)[number];

// Define stage colors for UI
const stageColors: Record<Stage, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-300",
  pipeline: "bg-purple-100 text-purple-800 border-purple-300",
  cold: "bg-gray-100 text-gray-800 border-gray-300",
  warm: "bg-orange-100 text-orange-800 border-orange-300",
  booked: "bg-green-100 text-green-800 border-green-300",
  lost: "bg-red-100 text-red-800 border-red-300",
};

interface CustomerFilterProps {
  selectedStages: Stage[];
  onStageChange: (stages: Stage[]) => void;
  stageCounts: Record<Stage, number>;
}

export default function CustomerFilter({ 
  selectedStages, 
  onStageChange, 
  stageCounts 
}: CustomerFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  // Toggle a stage selection
  const toggleStage = (stage: Stage) => {
    if (selectedStages.includes(stage)) {
      // If already selected, remove it
      onStageChange(selectedStages.filter(s => s !== stage));
    } else {
      // If not selected, add it
      onStageChange([...selectedStages, stage]);
    }
  };
  
  // Clear all stage filters
  const clearStageFilters = () => {
    onStageChange([]);
  };
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <Button 
          variant={showFilters ? "default" : "outline"} 
          size="sm" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1"
        >
          {showFilters ? "Hide" : "Show"} Filters
          {selectedStages.length > 0 && (
            <Badge variant="secondary">{selectedStages.length}</Badge>
          )}
        </Button>
        
        {selectedStages.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearStageFilters}
            className="text-muted-foreground"
          >
            Clear Filters <X className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      
      {showFilters && (
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="font-medium mb-2">Filter by Stage</h3>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((stage) => {
              const isSelected = selectedStages.includes(stage);
              
              return (
                <div 
                  key={stage} 
                  className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    isSelected ? stageColors[stage] : 'bg-background hover:bg-accent/50'
                  }`}
                  onClick={() => toggleStage(stage)}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-primary border-primary' : 'border-input'
                  }`}>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 text-primary-foreground">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium capitalize">{stage}</span>
                  <Badge variant="secondary" className="ml-1">
                    {stageCounts[stage] || 0}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Display active filters */}
      {selectedStages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedStages.map(stage => (
            <Badge 
              key={stage} 
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              <span className="capitalize">{stage}</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleStage(stage)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export { STAGES, stageColors };
export type { Stage };