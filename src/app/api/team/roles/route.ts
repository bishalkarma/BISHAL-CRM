import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

export async function GET() {
  console.log("Roles API called, isSupabaseAdminConfigured:", isSupabaseAdminConfigured);
  
  if (!supabaseAdmin) {
    return NextResponse.json({ 
      error: "Service role key missing",
      debug: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0
      }
    }, { status: 500 });
  }

  const { data: roles, error } = await supabaseAdmin
    .from("roles")
    .select("id, name, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Roles query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("Roles found:", roles?.length ?? 0);
  return NextResponse.json({ roles: roles ?? [] });
}
