"use client";

import * as React from "react";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: "transfer_in" | "transfer_out" | "system";
  title: string;
  message: string;
  customer_id?: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationToast() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    fetchUnreadNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const userId = typeof window !== "undefined" ? sessionStorage.getItem("demo_user_id") : null;
      if (!userId) return;

      const headers: HeadersInit = { "Content-Type": "application/json" };
      headers["x-user-id"] = userId;

      const res = await fetch("/api/notifications", { headers });
      if (!res.ok) return;

      const data = await res.json();
      const unread = (data.notifications || []).filter((n: Notification) => !n.is_read);
      
      if (unread.length > 0) {
        setNotifications(unread);
        setIsOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.map((n) =>
          fetch(`/api/notifications/${n.id}`, { method: "PATCH" })
        )
      );
      setIsOpen(false);
      setNotifications([]);
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  const handleViewAll = () => {
    markAllAsRead();
    router.push("/dashboard");
  };

  if (!isOpen || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 rounded-lg border border-border bg-card p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold">
            {notifications.length} New Notification{notifications.length > 1 ? "s" : ""}
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {notifications.slice(0, 3).map((notification) => (
          <div
            key={notification.id}
            className="rounded-md border border-border bg-secondary/50 p-3"
          >
            <div className="font-medium text-sm">{notification.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {notification.message}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleViewAll}
          className="flex-1 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
        >
          View All
        </button>
        <button
          onClick={markAllAsRead}
          className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
