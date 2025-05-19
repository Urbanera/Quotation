import React from 'react';
import { Badge } from "@/components/ui/badge";

// Simple stage checkbox component that handles its own state
export default function StageCheckbox({ 
  stage, 
  label, 
  count, 
  color,
  isSelected,
  onChange
}: { 
  stage: string; 
  label: string; 
  count: number;
  color: string;
  isSelected: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div 
      className={`flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer ${
        isSelected ? color : 'bg-white'
      }`}
      onClick={() => onChange(!isSelected)}
    >
      <div 
        className={`w-4 h-4 rounded border flex items-center justify-center ${
          isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
        }`}
      >
        {isSelected && (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={3} 
            stroke="currentColor" 
            className="w-3 h-3 text-white"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M4.5 12.75l6 6 9-13.5" 
            />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
      <Badge className="ml-1">{count}</Badge>
    </div>
  );
}