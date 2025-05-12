import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) {
          if (res.status === 401) {
            return null;
          }
          throw new Error(`Failed to fetch user: ${res.statusText}`);
        }
        return await res.json();
      } catch (err) {
        console.error("Error fetching user:", err);
        return null;
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error ?? null,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper functions for role-based access control
export function useRoleBasedAccess() {
  const { user } = useAuth();
  
  const canAccess = (roles: Array<"admin" | "manager" | "designer" | "viewer">) => {
    return user && roles.includes(user.role);
  };
  
  const isAdmin = () => user?.role === "admin";
  const isManager = () => user?.role === "manager";
  const isDesigner = () => user?.role === "designer";
  const isViewer = () => user?.role === "viewer";
  
  const canCreateQuotation = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canEditQuotation = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canApproveQuotation = () => user && (user.role === "admin" || user.role === "manager");
  
  const canCreateSalesOrder = () => user && (user.role === "admin" || user.role === "manager");
  const canEditSalesOrder = () => user && (user.role === "admin" || user.role === "manager");
  
  const canCreateInvoice = () => user && (user.role === "admin" || user.role === "manager");
  const canEditInvoice = () => user && (user.role === "admin" || user.role === "manager");
  
  const canManageUsers = () => user && user.role === "admin";
  const canManageTeams = () => user && (user.role === "admin" || user.role === "manager");
  
  const canRecordPayment = () => user && (user.role === "admin" || user.role === "manager");
  
  return {
    canAccess,
    isAdmin,
    isManager,
    isDesigner,
    isViewer,
    canCreateQuotation,
    canEditQuotation,
    canApproveQuotation,
    canCreateSalesOrder,
    canEditSalesOrder,
    canCreateInvoice,
    canEditInvoice,
    canManageUsers,
    canManageTeams,
    canRecordPayment
  };
}