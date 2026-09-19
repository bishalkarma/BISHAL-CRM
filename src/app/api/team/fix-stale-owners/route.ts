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

async function requireAdmin(req: NextRequest): Promise<
  NextResponse | { adminId: string; adminName: string }
> {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Service role key missing" },
      { status: 500 },
    );
  }

  const supabase = getServerClient(req);

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, roles(name)")
      .eq("id", user.id)
      .single();
    const p = profile as unknown as { id: string; display_name: string; roles?: { name: string } | null };
    if (p?.roles?.name === "Admin") return { adminId: user.id, adminName: p.display_name };
  }

  const demoUserId = req.headers.get("x-demo-user-id");
  if (demoUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, roles(name)")
      .eq("id", demoUserId)
      .single();
    const p = profile as unknown as { id: string; display_name: string; roles?: { name: string } | null };
    if (p?.roles?.name === "Admin") return { adminId: demoUserId, adminName: p.display_name };
  }

  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

/**
 * Self-healing endpoint: finds all records where owner_id is null or points
 * to a non-existent user, and reassigns them to the requesting admin.
 * 
 * Also fixes records where the owner name string belongs to a deleted user
 * (not in the active profiles table).
 * 
 * This runs automatically on app load so stale data never reaches the UI.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { adminId, adminName } = auth;

  try {
    // Get all active user IDs and names
    const { data: activeProfiles } = await supabaseAdmin!
      .from("profiles")
      .select("id, display_name");

    const activeUserIds = new Set((activeProfiles ?? []).map((p: { id: string }) => p.id));
    const activeUserNames = new Set((activeProfiles ?? []).map((p: { display_name: string }) => p.display_name?.toLowerCase()));

    let fixed = 0;

    // Tables that have owner and owner_id columns
    const tables = ["companies", "deals", "activities"] as const;

    for (const table of tables) {
      // 1. Fix records with owner_id pointing to deleted users
      //    (owner_id is set but doesn't match any active profile)
      // We do this by checking each record's owner_id against active users
      const { data: rows, error: fetchError } = await supabaseAdmin!
        .from(table)
        .select("id, owner, owner_id")
        .not("owner_id", "is", null);

      if (!fetchError && rows) {
        const staleIds = (rows as { id: string; owner: string; owner_id: string }[])
          .filter((r) => !activeUserIds.has(r.owner_id))
          .map((r) => r.id);

        if (staleIds.length > 0) {
          const { error: fixError } = await supabaseAdmin!
            .from(table)
            .update({ owner_id: adminId, owner: adminName })
            .in("id", staleIds);
          if (!fixError) fixed += staleIds.length;
        }
      }

      // 2. Fix records with null owner_id but stale owner name
      //    (owner name is not in the active user names set)
      const { data: nullOwnerRows, error: nullFetchError } = await supabaseAdmin!
        .from(table)
        .select("id, owner")
        .is("owner_id", null);

      if (!nullFetchError && nullOwnerRows) {
        const staleNullRows = (nullOwnerRows as { id: string; owner: string }[])
          .filter((r) => r.owner && !activeUserNames.has(r.owner.toLowerCase()))
          .map((r) => r.id);

        if (staleNullRows.length > 0) {
          const { error: fixError } = await supabaseAdmin!
            .from(table)
            .update({ owner_id: adminId, owner: adminName })
            .in("id", staleNullRows);
          if (!fixError) fixed += staleNullRows.length;
        }
      }
    }

    console.log(`[FixStaleOwners] Fixed ${fixed} records`);
    return NextResponse.json({ ok: true, fixed });
  } catch (error) {
    console.error("[FixStaleOwners] Error:", error);
    return NextResponse.json({ error: "Failed to fix stale owners" }, { status: 500 });
  }
}
