"use client";

import * as React from "react";
import { Users, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

type User = {
  id: string;
  username: string;
  displayName?: string;
  display_name: string;
  email: string;
  roleId: string;
  roleName: string | null;
  managerId?: string;
};

export function ManagerTeamAssignment() {
  const { user } = useCurrentUser();
  const [managers, setManagers] = React.useState<User[]>([]);
  const [salesReps, setSalesReps] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const userId = typeof window !== "undefined" ? sessionStorage.getItem("demo_user_id") : null;
      const userName = typeof window !== "undefined" ? sessionStorage.getItem("demo_user") : null;
      
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (userId) headers["x-demo-user-id"] = userId;
      if (userName) headers["x-demo-user"] = userName;
      
      const res = await fetch("/api/team/users", { headers });
      if (!res.ok) {
        console.error("Failed to fetch users:", res.status);
        return;
      }
      const data = await res.json();
      const allUsers = data.users || [];

      const managerUsers = allUsers.filter((u: User) => u.roleName === "Manager");
      const repUsers = allUsers.filter((u: User) => u.roleName === "Sales Rep");

      setManagers(managerUsers);
      setSalesReps(repUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManagerChange = async (repId: string, managerId: string) => {
    setSalesReps((prev) =>
      prev.map((rep) => (rep.id === repId ? { ...rep, managerId: managerId } : rep))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      const userId = typeof window !== "undefined" ? sessionStorage.getItem("demo_user_id") : null;
      const userName = typeof window !== "undefined" ? sessionStorage.getItem("demo_user") : null;
      
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (userId) headers["x-demo-user-id"] = userId;
      if (userName) headers["x-demo-user"] = userName;

      const updates = salesReps.map((rep) => ({
        id: rep.id,
        managerId: rep.managerId || null,
      }));

      console.log("Saving manager assignments:", updates);

      const res = await fetch("/api/team/manager-assignment", {
        method: "POST",
        headers,
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to save:", res.status, errorText);
        throw new Error("Failed to save");
      }

      const result = await res.json();
      console.log("Save result:", result);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save manager assignments:", err);
    } finally {
      setSaving(false);
    }
  };

  // Only Admin can assign teams
  if (!user || user.roleName !== "Admin") return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="text-sm text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            Manager Team Assignment
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign sales reps to managers. Managers will see their team&apos;s data in reports.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            "Saving..."
          ) : success ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {salesReps.map((rep) => (
          <div
            key={rep.id}
            className="flex items-center justify-between rounded-md border border-border bg-secondary/50 p-3"
          >
            <div>
              <div className="font-medium">{rep.displayName || rep.display_name}</div>
              <div className="text-xs text-muted-foreground">{rep.email}</div>
            </div>
            <select
              value={rep.managerId || ""}
              onChange={(e) => handleManagerChange(rep.id, e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">No Manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.displayName || manager.display_name}
                </option>
              ))}
            </select>
          </div>
        ))}

        {salesReps.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No sales reps found
          </div>
        )}
      </div>
    </div>
  );
}
