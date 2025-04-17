import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Team, User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, MoreHorizontal, User as UserIcon, Trash2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useRoute, Link } from 'wouter';
import TeamMemberForm from './TeamMemberForm';

// Type for user without password
type UserWithoutPassword = Omit<User, 'password'>;

export default function TeamDetailsPage() {
  const { toast } = useToast();
  const [, params] = useRoute('/teams/:id');
  const teamId = params && parseInt(params.id);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);

  // Fetch team details with members
  const { data: teamWithMembers, isLoading } = useQuery<Team & { members: UserWithoutPassword[] }>({
    queryKey: ['/api/teams', teamId, 'members'],
    queryFn: async () => {
      if (!teamId) throw new Error("Team ID is required");
      const res = await fetch(`/api/teams/${teamId}/members`);
      if (!res.ok) throw new Error("Failed to fetch team members");
      return res.json();
    },
    enabled: !!teamId,
  });

  // Mutation to remove a team member
  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: number, userId: number }) => {
      await apiRequest('DELETE', `/api/teams/${teamId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'members'] });
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the team.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to remove team member: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function handleRemoveMember(userId: number) {
    if (!teamId) return;
    
    if (confirm('Are you sure you want to remove this member from the team?')) {
      removeMemberMutation.mutate({ teamId, userId });
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'designer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading || !teamWithMembers) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center p-8">Loading team details...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/teams">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{teamWithMembers.name}</h1>
            {teamWithMembers.description && (
              <p className="text-muted-foreground mt-1">{teamWithMembers.description}</p>
            )}
          </div>
          <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Add a user to the "{teamWithMembers.name}" team.
                </DialogDescription>
              </DialogHeader>
              <TeamMemberForm 
                teamId={teamId!}
                existingMemberIds={teamWithMembers.members.map(m => m.id)}
                onSubmitSuccess={() => {
                  setIsAddMemberDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'members'] });
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage users that are part of this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamWithMembers.members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamWithMembers.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.fullName}</TableCell>
                    <TableCell>{member.username}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.active ? 'outline' : 'secondary'}>
                        {member.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRemoveMember(member.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6">
              <UserIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No members in this team</h3>
              <p className="text-muted-foreground mb-4">
                Add members to this team to collaborate on design projects.
              </p>
              <Button onClick={() => setIsAddMemberDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add First Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}