import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use Service Role to bypass RLS for Admin tasks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { title, body, data } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
    }

    // 1. Get all unique device tokens
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token, user_id");

    if (error) throw error;
    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ message: "No tokens found" });
    }

    // 2. Prepare Expo Push messages
    const messages = tokens.map(t => ({
      to: t.token,
      sound: "default",
      title,
      body,
      data: data || { screen: "Home" }, // Pass extra data for deep linking
    }));

    // 3. Batching Logic (Expo standard: max 100 per chunk)
    const chunkSize = 100;
    const results = [];

    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();
      results.push(...result.data);
    }

    // 4. (Optional but Recommended) Cleanup invalid tokens
    // If result.status === 'error' and details.error === 'DeviceNotRegistered',
    // you should delete that token from your Supabase push_tokens table.

    return NextResponse.json({ 
      success: true, 
      sent_count: messages.length,
      details: "Broadcast completed" 
    });

  } catch (err: any) {
    console.error("❌ ADMIN PUSH ERROR:", err.message);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
