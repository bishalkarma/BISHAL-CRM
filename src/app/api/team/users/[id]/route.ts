import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  role_id: string | null;
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

async function requireAdmin(req: NextRequest): Promise<
  NextResponse | { adminId: string }
> {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Service role key missing — add SUPABASE_SERVICE_ROLE_KEY to .env.local" },
      { status: 500 },
    );
  }

  const supabase = getServerClient(req);

  // 1. Real Supabase session
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, roles(name)")
      .eq("id", user.id)
      .single();
    const p = profile as unknown as ProfileRow & { roles?: { name: string } | null };
    if (p?.roles?.name === "Admin") return { adminId: user.id };
  }

  // 2. Demo user header fallback
  const demoUserId = req.headers.get("x-demo-user-id");
  const demoUser = req.headers.get("x-demo-user");
  if (demoUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, roles(name)")
      .eq("id", demoUserId)
      .single();
    const p = profile as unknown as ProfileRow & { roles?: { name: string } | null };
    if (p?.roles?.name === "Admin") return { adminId: demoUserId };
  }
  if (demoUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, roles(name)")
      .eq("username", demoUser)
      .single();
    const p = profile as unknown as ProfileRow & { roles?: { name: string } | null };
    if (p?.roles?.name === "Admin") return { adminId: p.id };
  }

  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { adminId } = auth;

  const { id: userId } = await params;
  if (userId === adminId) {
    return NextResponse.json({ error: "Cannot modify your own role" }, { status: 400 });
  }

  const body = await req.json();
  const { displayName, roleId } = body as { displayName?: string; roleId?: string };

  // Use service role key for admin updates (bypasses RLS)
  const patch: Record<string, unknown> = {};
  if (displayName) patch.display_name = displayName;
  if (roleId) patch.role_id = roleId;

  const { error } = await supabaseAdmin!.from("profiles").update(patch).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { adminId } = auth;

  const { id: userId } = await params;
  console.log("[DELETE USER] Admin:", adminId, "Deleting user:", userId);
  
  if (userId === adminId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    // 0. Get admin's display name for updating owner name fields
    const { data: adminProfile } = await supabaseAdmin!
      .from("profiles")
      .select("display_name")
      .eq("id", adminId)
      .single();
    const adminDisplayName = adminProfile?.display_name || "Admin";
    console.log("[DELETE USER] Admin display name:", adminDisplayName);

    // 1. Transfer all owned records to admin AND update created_by references AND update owner names
    console.log("[DELETE USER] Transferring owned records and updating created_by references...");
    const tables = ["companies", "contacts", "deals", "activities", "notifications", "transfer_history"] as const;
    
    for (const table of tables) {
      // Transfer owner_id references AND update owner name to admin's display name
      const { error: ownerError } = await supabaseAdmin!
        .from(table)
        .update({ owner_id: adminId, owner: adminDisplayName })
        .eq("owner_id", userId);
      if (ownerError) {
        console.error(`[DELETE USER] Error transferring ${table} owner_id:`, ownerError);
      }
      
      // Also fix records with owner_id = null but owner name matches the deleted user
      // This handles records created before the UUID system was implemented
      const { data: profile } = await supabaseAdmin!
        .from("profiles")
        .select("display_name, username")
        .eq("id", userId)
        .single();
      
      if (profile) {
        const deletedNames = [profile.display_name, profile.username].filter(Boolean);
        if (deletedNames.length > 0) {
          const { error: nullOwnerError } = await supabaseAdmin!
            .from(table)
            .update({ owner_id: adminId, owner: adminDisplayName })
            .is("owner_id", null)
            .in("owner", deletedNames);
          if (nullOwnerError) {
            console.warn(`[DELETE USER] Warning fixing null owner_id for ${table}:`, nullOwnerError.message);
          }
        }
      }
      
      // Update created_by references (this fixes the foreign key constraint issue)
      const { error: createdError } = await supabaseAdmin!.from(table).update({ created_by: adminId }).eq("created_by", userId);
      if (createdError) {
        console.warn(`[DELETE USER] Warning updating ${table} created_by:`, createdError.message);
      }
    }
    
    console.log(`[DELETE USER] Transferred all record references to admin ${adminId}`);

    // 2. Delete notifications for this user
    console.log("[DELETE USER] Deleting notifications...");
    await supabaseAdmin!.from("notifications").delete().eq("user_id", userId);

    // 3. Delete transfer history involving this user
    console.log("[DELETE USER] Deleting transfer history...");
    await supabaseAdmin!.from("transfer_history").delete().or(`from_owner_id.eq.${userId},to_owner_id.eq.${userId},transferred_by.eq.${userId}`);

    // 4. Delete profile
    console.log("[DELETE USER] Deleting profile...");
    const { error: profileError } = await supabaseAdmin!.from("profiles").delete().eq("id", userId);
    if (profileError) {
      console.error("[DELETE USER] Profile delete error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 5. Delete from Supabase Auth (if exists)
    console.log("[DELETE USER] Deleting from Supabase Auth...");
    try {
      const { error: authError } = await supabaseAdmin!.auth.admin.deleteUser(userId);
      if (authError) {
        console.warn("[DELETE USER] Auth delete warning (user might not exist in auth):", authError.message);
      } else {
        console.log("[DELETE USER] Successfully deleted from Supabase Auth");
      }
    } catch (authErr) {
      console.warn("[DELETE USER] Auth delete exception:", authErr);
    }

    console.log("[DELETE USER] User deleted successfully");
    return NextResponse.json({ ok: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("[DELETE USER] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
