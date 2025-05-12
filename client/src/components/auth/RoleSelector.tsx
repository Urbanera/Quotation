import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";

export default function RoleSelector() {
  const { user, setMockRole, logoutMutation } = useAuth();
  
  const handleRoleChange = (role: "admin" | "manager" | "designer" | "viewer" | null) => {
    if (role === null) {
      logoutMutation.mutate();
    } else {
      setMockRole(role);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-2 px-2">
          <UserCircle className="h-5 w-5 mr-1" />
          {user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Login"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleRoleChange("admin")}>
          Admin
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("manager")}>
          Manager
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("designer")}>
          Designer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("viewer")}>
          Viewer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleRoleChange(null)}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}