import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, User } from "lucide-react";

export default function ProfilePage() {
  const [, navigate] = useLocation();
  
  // This would come from authentication context in a real app
  const mockUser = {
    id: 1,
    username: "admin",
    email: "admin@designquotes.com",
    fullName: "Admin User",
    role: "admin"
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Your Profile</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/profile/edit")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center mb-8">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-12 w-12 text-gray-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1 text-lg font-medium">{mockUser.fullName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Username</h3>
                <p className="mt-1 text-lg font-medium">{mockUser.username}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                <p className="mt-1 text-lg font-medium">{mockUser.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <p className="mt-1 text-lg font-medium capitalize">{mockUser.role}</p>
              </div>
            </div>

            <div className="pt-6 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => navigate("/profile/change-password")}
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}