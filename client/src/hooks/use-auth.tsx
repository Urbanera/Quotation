import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Mock user data for testing different roles
const MOCK_USERS = {
  admin: {
    id: 1,
    username: "admin",
    password: "Password123",
    email: "admin@example.com",
    fullName: "Admin User",
    role: "admin",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  manager: {
    id: 2,
    username: "manager",
    password: "Password123",
    email: "manager@example.com",
    fullName: "Manager User",
    role: "manager",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  designer: {
    id: 3,
    username: "designer",
    password: "Password123",
    email: "designer@example.com",
    fullName: "Designer User",
    role: "designer",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  viewer: {
    id: 4,
    username: "viewer",
    password: "Password123",
    email: "viewer@example.com",
    fullName: "Viewer User",
    role: "viewer",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

type LoginCredentials = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
  setMockRole: (role: "admin" | "manager" | "designer" | "viewer" | null) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [mockUser, setMockUser] = useState<User | null>(null);
  
  const setMockRole = (role: "admin" | "manager" | "designer" | "viewer" | null) => {
    if (role === null) {
      setMockUser(null);
      return;
    }
    
    setMockUser(MOCK_USERS[role]);
    
    toast({
      title: `Switched to ${role} role`,
      description: `You are now viewing the application as a ${role}.`,
    });
  };
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      // If we have a mock user, return it instead of making the API call
      if (mockUser) {
        return mockUser;
      }
      
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
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Check if credentials match any of our mock users
      const userKey = Object.keys(MOCK_USERS).find(
        key => MOCK_USERS[key as keyof typeof MOCK_USERS].username === credentials.username && 
              MOCK_USERS[key as keyof typeof MOCK_USERS].password === credentials.password
      ) as keyof typeof MOCK_USERS | undefined;
      
      if (userKey) {
        return MOCK_USERS[userKey];
      }
      
      // If no mock user matches, try the real API
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        return await res.json();
      } catch (err) {
        throw new Error("Invalid username or password");
      }
    },
    onSuccess: (data) => {
      setMockUser(data);
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (mockUser) {
        // If using a mock user, just clear it
        setMockUser(null);
        return;
      }
      
      // Otherwise call the real API
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
        loginMutation,
        logoutMutation,
        setMockRole,
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
  
  // Customer Management Permissions
  const canViewCustomers = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canAddCustomers = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canEditCustomers = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canManageFollowups = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  
  // Quotation Permissions
  const canViewQuotation = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canCreateQuotation = () => user && (user.role === "admin" || user.role === "designer");
  const canEditQuotation = () => user && (user.role === "admin" || user.role === "designer");
  const canEditQuotationDiscount = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canApproveQuotation = () => user && (user.role === "admin" || user.role === "manager");
  const canDownloadQuotation = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  
  // Sales Order Permissions
  const canViewSalesOrder = () => user && (user.role === "admin" || user.role === "manager");
  const canCreateSalesOrder = () => user && (user.role === "admin" || user.role === "manager");
  const canEditSalesOrder = () => user && (user.role === "admin" || user.role === "manager");
  
  // Invoice Permissions
  const canViewInvoice = () => user && (user.role === "admin" || user.role === "manager");
  const canCreateInvoice = () => user && (user.role === "admin" || user.role === "manager");
  const canEditInvoice = () => user && (user.role === "admin" || user.role === "manager");
  
  // Payment Permissions
  const canViewPayment = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canCreatePayment = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canEditPayment = () => user && (user.role === "admin" || user.role === "manager");
  
  // Administrative Permissions
  const canManageUsers = () => user && user.role === "admin";
  const canManageTeams = () => user && (user.role === "admin");
  const canManageSettings = () => user && user.role === "admin";
  const canManageAccessories = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  const canManageProducts = () => user && (user.role === "admin" || user.role === "manager" || user.role === "designer");
  
  return {
    canAccess,
    isAdmin,
    isManager,
    isDesigner,
    isViewer,
    
    // Customer permissions
    canViewCustomers,
    canAddCustomers,
    canEditCustomers,
    canManageFollowups,
    
    // Quotation permissions
    canViewQuotation,
    canCreateQuotation,
    canEditQuotation,
    canEditQuotationDiscount,
    canApproveQuotation,
    canDownloadQuotation,
    
    // Sales Order permissions
    canViewSalesOrder,
    canCreateSalesOrder,
    canEditSalesOrder,
    
    // Invoice permissions
    canViewInvoice,
    canCreateInvoice,
    canEditInvoice,
    
    // Payment permissions
    canViewPayment,
    canCreatePayment,
    canEditPayment,
    
    // Administrative permissions
    canManageUsers,
    canManageTeams,
    canManageSettings,
    canManageAccessories,
    canManageProducts
  };
}