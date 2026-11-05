import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { evaluateCustomerDeletePermission } from "@/lib/company-guards";

type CallerProfile = {
  id: string;
  username: string;
  display_name: string;
  roleName: string;
};

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

async function resolveCaller(req: NextRequest): Promise<CallerProfile | null> {
  if (!supabaseAdmin) return null;

  let userId: string | null = null;
  const supabase = getServerClient(req);
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) userId = user.id;
  }

  if (!userId) {
    userId = req.headers.get("x-demo-user-id");
  }

  if (userId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, roles(name)")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      const row = data as unknown as {
        id: string;
        username: string;
        display_name: string;
        roles?: { name: string } | null;
      };
      return {
        id: row.id,
        username: row.username,
        display_name: row.display_name,
        roleName: row.roles?.name ?? "Viewer",
      };
    }
  }

  const demoUser = req.headers.get("x-demo-user");
  if (demoUser) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, roles(name)")
      .eq("username", demoUser)
      .maybeSingle();
    if (data) {
      const row = data as unknown as {
        id: string;
        username: string;
        display_name: string;
        roles?: { name: string } | null;
      };
      return {
        id: row.id,
        username: row.username,
        display_name: row.display_name,
        roleName: row.roles?.name ?? "Viewer",
      };
    }
  }

  return null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Service role key missing" },
      { status: 500 },
    );
  }

  const caller = await resolveCaller(req);
  if (!caller) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: companyId } = await params;
  if (!companyId) {
    return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
  }

  const { data: company, error: companyErr } = await supabaseAdmin
    .from("companies")
    .select("id, name, owner, owner_id")
    .eq("id", companyId)
    .maybeSingle();

  if (companyErr) {
    return NextResponse.json({ error: companyErr.message }, { status: 500 });
  }
  if (!company) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const target = company as {
    id: string;
    name: string;
    owner: string | null;
    owner_id?: string | null;
  };

  // Determine ownership / team scope for Option A permissions
  let isOwnerOrTeam = false;
  if (caller.roleName === "Admin") {
    isOwnerOrTeam = true;
  } else if (caller.roleName === "Manager") {
    if (target.owner_id === caller.id) {
      isOwnerOrTeam = true;
    } else if (target.owner_id) {
      const { data: teamRows } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("manager_id", caller.id);
      const teamIds = new Set(
        ((teamRows ?? []) as { id: string }[]).map((r) => r.id),
      );
      isOwnerOrTeam = teamIds.has(target.owner_id);
    } else if (
      target.owner &&
      (target.owner.toLowerCase() === caller.display_name.toLowerCase() ||
        target.owner.toLowerCase() === caller.username.toLowerCase())
    ) {
      isOwnerOrTeam = true;
    }
  } else if (caller.roleName === "Sales Rep") {
    if (target.owner_id === caller.id) {
      isOwnerOrTeam = true;
    } else if (
      !target.owner_id &&
      target.owner &&
      (target.owner.toLowerCase() === caller.display_name.toLowerCase() ||
        target.owner.toLowerCase() === caller.username.toLowerCase())
    ) {
      isOwnerOrTeam = true;
    }
  }

  // Count linked deals for Option A safety guard
  const { data: linkedDeals, error: dealsErr } = await supabaseAdmin
    .from("deals")
    .select("id")
    .eq("company_id", companyId);

  if (dealsErr) {
    return NextResponse.json({ error: dealsErr.message }, { status: 500 });
  }

  const dealIds = ((linkedDeals ?? []) as { id: string }[]).map((d) => d.id);
  const permission = evaluateCustomerDeletePermission({
    role: caller.roleName,
    isOwnerOrTeam,
    dealCount: dealIds.length,
  });

  if (!permission.allowed) {
    return NextResponse.json(
      { error: permission.reason ?? "Forbidden" },
      { status: 403 },
    );
  }

  // Clean up non-cascading & child foreign keys safely in order before deleting company
  await supabaseAdmin
    .from("notifications")
    .delete()
    .eq("customer_id", companyId);
  await supabaseAdmin
    .from("transfer_history")
    .delete()
    .eq("customer_id", companyId);
  await supabaseAdmin.from("activities").delete().eq("company_id", companyId);
  await supabaseAdmin
    .from("stage_transitions")
    .delete()
    .eq("company_id", companyId);

  if (dealIds.length > 0) {
    await supabaseAdmin.from("deal_lines").delete().in("deal_id", dealIds);
    await supabaseAdmin.from("deals").delete().eq("company_id", companyId);
  }

  await supabaseAdmin.from("contacts").delete().eq("company_id", companyId);

  const { error: deleteErr } = await supabaseAdmin
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deletedId: companyId });
}
