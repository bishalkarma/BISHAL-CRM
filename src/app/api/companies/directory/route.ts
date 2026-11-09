import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getServerClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const cookieString = req.headers.get("cookie") ?? "";
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { cookie: cookieString } },
  });
}

async function isAuthenticatedCaller(req: NextRequest): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const supabase = getServerClient(req);
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) return true;
  }

  const demoUserId = req.headers.get("x-demo-user-id");
  if (demoUserId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", demoUserId)
      .maybeSingle();
    if (data?.id) return true;
  }

  const demoUser = req.headers.get("x-demo-user");
  if (demoUser) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", demoUser)
      .maybeSingle();
    if (data?.id) return true;
  }

  return false;
}

/**
 * Returns minimal company identity metadata across the entire CRM so that
 * duplicate customer names are caught and blocked even when a Sales Rep or
 * Manager only loads their own role-filtered companies in the main view.
 */
export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ companies: [] });
  }

  const authed = await isAuthenticatedCaller(req);
  if (!authed) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("id, name, area, emirate, owner")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ companies: data ?? [] });
}
