/**
 * Username-based login API.
 *
 * Looks up the user's real email from the profiles table using the
 * service role key (bypasses RLS), then authenticates with Supabase.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server not configured — check SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  // 1. Look up user by username using service role key (bypasses RLS)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, email, role_id, roles(name)")
    .eq("username", username.toLowerCase())
    .single();

  if (profileError || !profile) {
    console.log("Profile lookup failed:", profileError?.message ?? "not found");
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  // 2. Use the stored email from profiles (set when user was created)
  const userEmail = profile.email;
  if (!userEmail) {
    console.log("No email on profile for username:", username);
    return NextResponse.json(
      { error: "User has no email on file — ask admin to fix" },
      { status: 401 }
    );
  }

  // 3. Authenticate with Supabase using service role key (bypasses email confirmation)
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email: userEmail,
    password,
  });

  if (authError) {
    console.log("Auth failed for email:", userEmail, "—", authError.message);
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  // 4. Return user info
  return NextResponse.json({
    user: {
      id: authData.user.id,
      username: profile.username,
      displayName: profile.display_name,
      roleName: (profile as unknown as { roles?: { name: string } | null }).roles?.name ?? null,
    },
    session: authData.session,
  });
}
