"use client";

import { TeamSettings } from "./team-settings";

/**
 * Wrapper that checks user role before showing TeamSettings.
 * Only Admin and Manager roles can see team management.
 */
export function TeamSettingsWrapper() {
  const userRole =
    typeof window !== "undefined"
      ? sessionStorage.getItem("demo_user_role") ?? "Viewer"
      : "Viewer";

  if (userRole !== "Admin") {
    return null;
  }

  return <TeamSettings />;
}
