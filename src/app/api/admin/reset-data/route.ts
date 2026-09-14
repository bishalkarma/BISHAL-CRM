/**
 * Admin-only: wipe every CRM record (companies, contacts, deals, activities,
 * transitions). User accounts are never touched — this is a content reset,
 * not an account reset.
 *
 * Requires Admin role. The caller must send:
 *   - A real Supabase session cookie, OR
 *   - x-demo-user-id / x-demo-user headers (trusted internal headers)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  role_id: string | null;
  roles?: { name: string } | null;
};

async function requireAdmin(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Service role key missing — add SUPABASE_SERVICE_ROLE_KEY to .env.local" },
      { status: 500 },
    );
  }

  // Try Supabase session cookie first.
  const { data: sessionData } = await supabaseAdmin.auth.getUser();

  let profile: ProfileRow | null = null;
  if (sessionData?.user) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, email, role_id, roles(name)")
      .eq("id", sessionData.user.id)
      .single();
    profile = data as unknown as ProfileRow | null;
  }

  // Fallback to trusted internal headers.
  if (!profile) {
    const demoUserId = req.headers.get("x-demo-user-id");
    const demoUser = req.headers.get("x-demo-user");
    const { data } = demoUserId
      ? await supabaseAdmin
          .from("profiles")
          .select("id, username, display_name, email, role_id, roles(name)")
          .eq("id", demoUserId)
          .single()
      : demoUser
        ? await supabaseAdmin
            .from("profiles")
            .select("id, username, display_name, email, role_id, roles(name)")
            .eq("username", demoUser)
            .single()
        : { data: null };
    profile = data as unknown as ProfileRow | null;
  }

  if (!profile || profile.roles?.name !== "Admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  return { profile };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  // Order matters: children first, then parents.
  const tables: { name: string; label: string }[] = [
    { name: "deal_lines", label: "deal lines" },
    { name: "activities", label: "activities" },
    { name: "stage_transitions", label: "stage transitions" },
    { name: "contacts", label: "contacts" },
    { name: "deals", label: "deals" },
    { name: "companies", label: "companies" },
  ];

  const counts: Record<string, number> = {};

  for (const t of tables) {
    // Capture count BEFORE deleting so the response can report what was wiped.
    const { count } = await supabaseAdmin
      .from(t.name)
      .select("*", { count: "exact", head: true });
    counts[t.label] = count ?? 0;

    const { error } = await supabaseAdmin.from(t.name).delete().neq("id", "");
    if (error) {
      return NextResponse.json(
        { error: `Failed to clear ${t.label}: ${error.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    message: "All CRM data deleted",
    deleted: counts,
  });
}

/**
 * Optional: GET returns counts without deleting — used by the confirmation
 * modal to show the user exactly what will go away.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  const tables: { name: string; label: string }[] = [
    { name: "companies", label: "companies" },
    { name: "contacts", label: "contacts" },
    { name: "deals", label: "deals" },
    { name: "activities", label: "activities" },
    { name: "stage_transitions", label: "stage transitions" },
  ];

  const counts: Record<string, number> = {};
  for (const t of tables) {
    const { count } = await supabaseAdmin
      .from(t.name)
      .select("*", { count: "exact", head: true });
    counts[t.label] = count ?? 0;
  }

  return NextResponse.json({ counts });
}
