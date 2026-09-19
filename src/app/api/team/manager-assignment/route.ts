import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { updates } = await req.json();

  if (!updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: "Invalid updates" }, { status: 400 });
  }

  const errors: string[] = [];

  for (const update of updates) {
    const { error } = await supabase
      .from("profiles")
      .update({ manager_id: update.managerId })
      .eq("id", update.id);

    if (error) {
      errors.push(`Failed to update user ${update.id}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
