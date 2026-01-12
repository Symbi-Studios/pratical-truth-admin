import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  try {
    const { token, device } = await req.json();
    console.log("📦 REQUEST BODY:", token); 

    if (!token) {
      return NextResponse.json({ error: "Token missing" }, { status: 400 });
    }

    const authHeader = req.headers.get("Authorization");

    // ✅ Initialize with required "noop" cookie methods to satisfy TypeScript
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY !,
      {
        cookies: {
          getAll() { return []; },
          setAll() { /* Do nothing for mobile requests */ },
        },
        global: {
          headers: { Authorization: authHeader || "" },
        },
      }
    );

    // ✅ Identify the Expo user via the Authorization header
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: dbError } = await supabase
      .from("push_tokens")
      .upsert(
        {
          token,
          device: device || "unknown",
          user_id: user.id, 
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: "Token stored" });
  } catch (error) {
    console.error("❌ API ERROR:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}
