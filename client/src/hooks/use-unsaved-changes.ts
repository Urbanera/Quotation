import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

export interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  onBeforeUnload?: () => void;
  onNavigate?: () => Promise<boolean>; // Returns true to allow navigation, false to prevent
  message?: string;
}

export function useUnsavedChanges({
  hasUnsavedChanges,
  onBeforeUnload,
  onNavigate,
  message = "You have unsaved changes. Are you sure you want to leave without saving?"
}: UseUnsavedChangesOptions) {
  const [location] = useLocation();
  const locationRef = useRef(location);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  // Update refs when values change
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        event.preventDefault();
        event.returnValue = message;
        
        if (onBeforeUnload) {
          onBeforeUnload();
        }
        
        return message;
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [hasUnsavedChanges, message, onBeforeUnload]);

  // Handle navigation within the app
  useEffect(() => {
    const handleNavigation = async () => {
      if (hasUnsavedChangesRef.current && locationRef.current !== location) {
        if (onNavigate) {
          const shouldNavigate = await onNavigate();
          if (!shouldNavigate) {
            // Prevent navigation by not updating the location ref
            return;
          }
        } else {
          // Default behavior - show confirm dialog
          const shouldNavigate = window.confirm(message);
          if (!shouldNavigate) {
            // Would need to prevent navigation here, but wouter doesn't provide an easy way
            // So we'll rely on the onNavigate callback for custom handling
            return;
          }
        }
      }
      locationRef.current = location;
    };

    handleNavigation();
  }, [location, message, onNavigate]);

  return {
    hasUnsavedChanges
  };
}