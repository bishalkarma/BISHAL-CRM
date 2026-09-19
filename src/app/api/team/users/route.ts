import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  role_id: string | null;
  manager_id: string | null;
  created_at: string;
};

function getServerClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieString = req.headers.get("cookie") ?? "";
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { cookie: cookieString } },
  });
}

/**
 * Authenticate the caller. Order of trust:
 * 1. Real Supabase session cookie (from supabase.auth.getUser)
 * 2. Trusted demo user header (set by our own apiFetch wrapper)
 * 3. Reject
 */
async function requireAuth(req: NextRequest): Promise<
  NextResponse | { profile: ProfileRow & { roles?: { name: string } | null } }
> {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Service role key missing — add SUPABASE_SERVICE_ROLE_KEY to .env.local" },
      { status: 500 },
    );
  }

  const supabase = getServerClient(req);

  // 1. Try real Supabase session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, display_name, email, role_id, manager_id, created_at, roles(name)")
      .eq("id", user.id)
      .single();
    const p = profile as unknown as ProfileRow & { roles?: { name: string } | null };
    return { profile: p };
  }

  // 2. Fallback: trusted demo user header from our own client
  const demoUserId = req.headers.get("x-demo-user-id");
  const demoUser = req.headers.get("x-demo-user");
  if (demoUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, display_name, email, role_id, manager_id, created_at, roles(name)")
      .eq("id", demoUserId)
      .single();
    const p = profile as unknown as ProfileRow & { roles?: { name: string } | null };
    if (p) return { profile: p };
  }

  // 3. Last resort: match by username
  if (demoUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, display_name, email, role_id, manager_id, created_at, roles(name)")
      .eq("username", demoUser)
      .single();
    const p = profile as unknown as ProfileRow & { roles?: { name: string } | null };
    if (p) return { profile: p };
  }

  return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const supabase = getServerClient(req);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, email, role_id, manager_id, created_at, roles(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (profiles ?? []).map((p) => {
    const withRoles = p as unknown as ProfileRow & { roles?: { name: string } | null };
    return {
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      email: p.email,
      roleId: p.role_id,
      roleName: withRoles.roles?.name ?? null,
      managerId: p.manager_id ?? null,
      createdAt: p.created_at,
    };
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Only Admin/Manager can create users
  const p = auth.profile;
  if (p?.roles?.name !== "Admin" && p?.roles?.name !== "Manager") {
    return NextResponse.json({ error: "Admin or Manager role required." }, { status: 403 });
  }

  const body = await req.json();
  const { email, username, displayName, password, roleId } = body as {
    email: string;
    username: string;
    displayName: string;
    password: string;
    roleId: string;
  };

  if (!email || !username || !displayName || !password || !roleId) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const { data: authUser, error: authError } =
    await supabaseAdmin!.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName },
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // 2. Insert the profile row linking to the auth user using service role key
  // (bypasses RLS so admin can always create profiles)
  const { error: profileError } = await supabaseAdmin!.from("profiles").insert({
    id: authUser.user.id,
    username,
    display_name: displayName,
    email,
    role_id: roleId,
  });

  if (profileError) {
    await supabaseAdmin!.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: authUser.user.id,
      username,
      displayName,
      email,
    },
  });
}
