import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getServerClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieString = req.headers.get("cookie") ?? "";
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { cookie: cookieString } },
  });
}

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
  }

  const supabase = getServerClient(req);

  // 1. Try to get user from Supabase session
  const { data: { user } } = await supabase.auth.getUser();
  
  let userId = user?.id;

  // 2. Fallback to our custom header for demo mode
  if (!userId) {
    userId = req.headers.get("x-demo-user-id") ?? undefined;
  }

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 3. Fetch full profile from database
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, email, role_id, roles(name)")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const p = profile as unknown as { id: string; username: string; display_name: string; email: string; roles?: { name: string } | null };
  return NextResponse.json({
    user: {
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      email: p.email,
      roleName: p.roles?.name ?? "Viewer",
    }
  });
}
