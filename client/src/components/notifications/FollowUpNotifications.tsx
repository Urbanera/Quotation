import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { format, isToday, isPast } from "date-fns";

interface FollowUp {
  id: number;
  customerId: number;
  notes: string;
  nextFollowUpDate: string;
  completed: boolean;
  customer: {
    id: number;
    name: string;
    email: string;
  };
}

export function FollowUpNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ['/api/follow-ups/pending'],
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Filter for overdue and today's follow-ups
  const urgentFollowUps = followUps.filter(followUp => {
    if (followUp.completed || !followUp.nextFollowUpDate) return false;
    
    const followUpDate = new Date(followUp.nextFollowUpDate);
    return isPast(followUpDate) || isToday(followUpDate);
  });

  const overdueCount = urgentFollowUps.filter(followUp => {
    const followUpDate = new Date(followUp.nextFollowUpDate);
    return isPast(followUpDate) && !isToday(followUpDate);
  }).length;

  const todayCount = urgentFollowUps.filter(followUp => {
    const followUpDate = new Date(followUp.nextFollowUpDate);
    return isToday(followUpDate);
  }).length;

  // Check for new notifications
  useEffect(() => {
    if (urgentFollowUps.length > 0) {
      setHasNewNotifications(true);
    }
  }, [urgentFollowUps.length]);

  const handleOpenNotifications = () => {
    setIsOpen(true);
    setHasNewNotifications(false);
  };

  const getFollowUpStatus = (followUp: FollowUp) => {
    if (!followUp.nextFollowUpDate) return { label: "No date", variant: "secondary" as const };
    
    const followUpDate = new Date(followUp.nextFollowUpDate);
    
    if (isPast(followUpDate) && !isToday(followUpDate)) {
      return { label: "Overdue", variant: "destructive" as const };
    } else if (isToday(followUpDate)) {
      return { label: "Today", variant: "default" as const };
    } else {
      return { label: "Upcoming", variant: "secondary" as const };
    }
  };

  const formatFollowUpDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return "Today";
    } else if (isPast(date)) {
      return `${format(date, "MMM dd")} (Overdue)`;
    } else {
      return format(date, "MMM dd, yyyy");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
          onClick={handleOpenNotifications}
        >
          <Bell className="h-5 w-5" />
          {urgentFollowUps.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {urgentFollowUps.length}
            </Badge>
          )}
          {hasNewNotifications && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Follow-up Notifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {urgentFollowUps.length > 0 && (
              <div className="flex gap-2 text-xs">
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {overdueCount} Overdue
                  </Badge>
                )}
                {todayCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {todayCount} Today
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-64">
              {urgentFollowUps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <CheckCircle2 className="h-8 w-8 mb-2" />
                  <p className="text-sm">No urgent follow-ups</p>
                  <p className="text-xs text-gray-400">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentFollowUps.map((followUp) => {
                    const status = getFollowUpStatus(followUp);
                    return (
                      <div key={followUp.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <Link href={`/customers/view/${followUp.customerId}`}>
                            <span className="font-medium text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                              {followUp.customer.name}
                            </span>
                          </Link>
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {followUp.notes}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatFollowUpDate(followUp.nextFollowUpDate)}
                          </div>
                          <Link href={`/customers/view/${followUp.customerId}`}>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            {urgentFollowUps.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <Link href="/customers">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View All Follow-ups
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}