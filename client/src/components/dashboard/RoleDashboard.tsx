import { useAuth } from "@/hooks/use-auth";
import AdminDashboard from "./AdminDashboard";
import ManagerDashboard from "./ManagerDashboard";
import DesignerDashboard from "./DesignerDashboard";
import ViewerDashboard from "./ViewerDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoleDashboard() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  if (!user) {
    // If not logged in or no role, show viewer dashboard
    return <ViewerDashboard />;
  }
  
  // Show appropriate dashboard based on user role
  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "designer":
      return <DesignerDashboard />;
    case "viewer":
    default:
      return <ViewerDashboard />;
  }
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-12 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
      
      <div className="col-span-full p-4 border rounded-lg">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center border-b pb-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}