import * as React from "react";

type UserInfo = {
  id: string;
  displayName: string;
  email: string;
  roleName: string;
};

export function useCurrentUser() {
  const [user, setUser] = React.useState<UserInfo | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const userId = typeof window !== "undefined" ? sessionStorage.getItem("demo_user_id") : null;
    const userName = typeof window !== "undefined" ? sessionStorage.getItem("demo_user") : null;
    
    if (!userId && !userName) {
      setLoading(false);
      return;
    }

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (userId) headers["x-demo-user-id"] = userId;
    if (userName) headers["x-demo-user"] = userName;

    fetch("/api/auth/me", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch((err) => console.error("Error resolving user info:", err))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
