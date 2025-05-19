import React from 'react';
import { Badge } from "@/components/ui/badge";

// Define available stages
const STAGES = ["new", "pipeline", "cold", "warm", "booked", "lost"] as const;
type Stage = (typeof STAGES)[number];

// Define stage colors mapping
const stageColors: Record<Stage, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-300",
  pipeline: "bg-purple-100 text-purple-800 border-purple-300",
  cold: "bg-gray-100 text-gray-800 border-gray-300",
  warm: "bg-orange-100 text-orange-800 border-orange-300",
  booked: "bg-green-100 text-green-800 border-green-300",
  lost: "bg-red-100 text-red-800 border-red-300",
};

// Stage labels for display
const stageLabels: Record<Stage, string> = {
  new: "New",
  pipeline: "Pipeline",
  cold: "Cold",
  warm: "Warm",
  booked: "Booked",
  lost: "Lost",
};

interface MultiStageFilterProps {
  selectedStages: Stage[];
  onChange: (stages: Stage[]) => void;
  stageCounts: Record<Stage, number>;
}

export default function MultiStageFilter({ 
  selectedStages, 
  onChange, 
  stageCounts 
}: MultiStageFilterProps) {
  // Toggle a stage selection
  const toggleStage = (stage: Stage) => {
    if (selectedStages.includes(stage)) {
      // If already selected, remove it
      onChange(selectedStages.filter(s => s !== stage));
    } else {
      // If not selected, add it
      onChange([...selectedStages, stage]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 my-2">
      {STAGES.map((stage) => {
        const isSelected = selectedStages.includes(stage);
        
        return (
          <div 
            key={stage} 
            className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer ${
              isSelected ? stageColors[stage] : 'bg-white'
            }`}
            onClick={() => toggleStage(stage)}
          >
            <div className={`w-4 h-4 rounded border ${
              isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
            } flex items-center justify-center`}>
              {isSelected && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium cursor-pointer">
              {stageLabels[stage]}
            </span>
            <Badge className={`ml-1 ${isSelected ? 'bg-white/40 text-gray-800' : 'bg-gray-100'}`}>
              {stageCounts[stage] || 0}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

// Export constants for use in other components
export { STAGES, stageColors, stageLabels };
export type { Stage };