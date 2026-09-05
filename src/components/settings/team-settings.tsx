"use client";

import * as React from "react";
import { Shield, Trash2, UserPlus, Users, Loader2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn, initials } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from "@/components/providers/data-provider";
import { apiFetch } from "@/lib/api-client";

type User = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  createdAt: string;
};

type Role = {
  id: string;
  name: string;
};

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-accent/15 text-accent",
  Manager: "bg-success/15 text-success",
  "Sales Rep": "bg-warning/15 text-warning",
  Viewer: "bg-secondary text-muted-foreground",
};

export function TeamSettings() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Get current user ID from session storage
  const currentUserId = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("demo_user_id");
  }, []);

  // Add user modal
  const [addOpen, setAddOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newUsername, setNewUsername] = React.useState("");
  const [newDisplayName, setNewDisplayName] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newRoleId, setNewRoleId] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Credentials popup (after successful creation)
  const [credentials, setCredentials] = React.useState<{
    email: string;
    username: string;
    password: string;
  } | null>(null);

  // Edit role
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editRoleId, setEditRoleId] = React.useState("");
  const [savingRole, setSavingRole] = React.useState(false);

  // Delete confirmation
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const adminUserId = currentUserId;

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiFetch("/api/team/users"),
        apiFetch("/api/team/roles"),
      ]);

      console.log("Users response:", usersRes.status, usersRes.statusText);
      console.log("Roles response:", rolesRes.status, rolesRes.statusText);

      if (!usersRes.ok || !rolesRes.ok) {
        const usersError = await usersRes.text();
        const rolesError = await rolesRes.text();
        console.log("Users error:", usersError);
        console.log("Roles error:", rolesError);
        
        if (usersRes.status === 401) {
          setError("Not authenticated. Please sign out and sign back in to refresh your session.");
        } else {
          setError(`Team management error. Users: ${usersRes.status} ${usersError}, Roles: ${rolesRes.status} ${rolesError}`);
        }
        setLoading(false);
        return;
      }

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();

      console.log("Users data:", usersData);
      console.log("Roles data:", rolesData);

      setUsers(usersData.users ?? []);
      setRoles(rolesData.roles ?? []);
    } catch (err) {
      console.error("Load error:", err);
      setError("Could not load team members. Check that SUPABASE_SERVICE_ROLE_KEY is set in .env.local.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreate = async () => {
    setCreateError(null);
    if (!newEmail || !newUsername || !newDisplayName || !newPassword || !newRoleId) {
      setCreateError("All fields are required.");
      return;
    }

    setCreating(true);
    try {
      const res = await apiFetch("/api/team/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          username: newUsername,
          displayName: newDisplayName,
          password: newPassword,
          roleId: newRoleId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create user.");
        return;
      }

      // Show credentials popup
      setCredentials({
        email: newEmail,
        username: newUsername,
        password: newPassword,
      });

      // Reset form
      setNewEmail("");
      setNewUsername("");
      setNewDisplayName("");
      setNewPassword("");
      setNewRoleId("");
      setAddOpen(false);

      // Reload users
      void loadUsers();
    } catch {
      setCreateError("Something went wrong.");
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId: string) => {
    setSavingRole(true);
    try {
      const res = await apiFetch(`/api/team/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: editRoleId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to update role.");
        return;
      }
      setEditingUserId(null);
      void loadUsers();
    } catch {
      alert("Failed to update role.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUserId) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/team/users/${deletingUserId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to delete user.");
        return;
      }
      setDeletingUserId(null);
      void loadUsers();
    } catch {
      alert("Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Team & permissions</h3>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their access levels.
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-2"
          disabled={loading}
        >
          Add team member
        </Button>
      </div>

      {error ? (
        <Card className="p-4 border-warning/40 bg-warning/[0.06]">
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{error}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code> to your <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">.env.local</code> file to enable team management.
              </p>
            </div>
          </div>
        </Card>
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-4">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No team members yet. Click &quot;Add team member&quot; to create one.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const isAdmin = user.id === adminUserId;
            return (
              <div
                key={user.id}
                className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-secondary/30"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-accent/15 text-accent text-xs font-semibold">
                    {initials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.displayName}</span>
                    {user.id === adminUserId && (
                      <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px]">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.username} · {user.email}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={savingRole || isAdmin}>
                          <Button variant="outline" size="sm" className="w-[140px] justify-between">
                            {roles.find((r) => r.id === editRoleId)?.name ?? "Select"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {roles
                            .filter((r) => r.name !== "Admin")
                            .map((r) => (
                              <DropdownMenuItem
                                key={r.id}
                                onClick={() => setEditRoleId(r.id)}
                              >
                                {r.name}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="sm"
                        onClick={() => handleRoleChange(user.id)}
                        disabled={savingRole}
                      >
                        {savingRole ? <Loader2 className="size-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUserId(null)}
                        disabled={savingRole}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Badge
                        className={cn(
                          "gap-1 px-2 py-0.5 text-xs",
                          ROLE_COLORS[user.roleName ?? ""] ?? "bg-secondary text-muted-foreground",
                        )}
                      >
                        {user.roleName ?? "No role"}
                      </Badge>
                      {!isAdmin && (
                        <>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingUserId(user.id);
                              setEditRoleId(user.roleId ?? "");
                            }}
                            title="Change role"
                          >
                            <Shield className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingUserId(user.id)}
                            title="Delete user"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add User Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>
              Create a new user account. Share the credentials with them after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Email address <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Username <span className="text-destructive">*</span>
                </label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Display name <span className="text-destructive">*</span>
              </label>
              <Input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Role <span className="text-destructive">*</span>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {newRoleId
                      ? roles.find((r) => r.id === newRoleId)?.name ?? "Select role"
                      : "Select role"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100%-2rem)]">
                  {roles
                    .filter((r) => r.name !== "Admin")
                    .map((r) => (
                      <DropdownMenuItem
                        key={r.id}
                        onClick={() => setNewRoleId(r.id)}
                      >
                        {r.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {createError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {createError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create user
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Popup */}
      <Dialog
        open={credentials !== null}
        onOpenChange={(open) => {
          if (!open) setCredentials(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-success">User created successfully</DialogTitle>
            <DialogDescription>
              Copy these credentials and share them with the new team member. You won&apos;t see the password again.
            </DialogDescription>
          </DialogHeader>

          {credentials && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-2">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </div>
                  <div className="text-sm font-medium">{credentials.email}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Username
                  </div>
                  <div className="text-sm font-medium">{credentials.username}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Password
                  </div>
                  <div className="text-sm font-medium font-mono">{credentials.password}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The user can log in at <strong>your CRM login page</strong> with these credentials.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deletingUserId !== null}
        onOpenChange={(open) => !open && setDeletingUserId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this user?</DialogTitle>
            <DialogDescription>
              owned by this user will be transferred to your account. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUserId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete user"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
