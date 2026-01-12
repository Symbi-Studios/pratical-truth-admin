import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { record, old_record, table, type } = payload;

    let shouldNotify = false;
    let title = "";
    let body = "";

    // ✅ Table-Specific Rules
    if (table === "audios") {
      // Trigger ONLY when toggled from false to true
      shouldNotify = record.published === true && (!old_record || old_record.published === false);
      title = "New Audio Teaching 🎧";
      body = record.title;
    } 
    else if (table === "events") {
      // Trigger ONLY when toggled from false to true
      shouldNotify = record.published === true && (!old_record || old_record.published === false);
      title = "Upcoming Event 📅";
      body = record.title; 
    } 
    else if (table === "daily_dose") {
      // Trigger on NEW entries (INSERT) only
      shouldNotify = type === "INSERT";
      title = "Today's Dose ✨";
      body = record.content?.substring(0, 60) + "...";
    }

    if (!shouldNotify) return NextResponse.json({ message: "No notification sent" });

    // 1. Fetch Tokens
    const { data: tokens } = await supabaseAdmin.from("push_tokens").select("token");
    if (!tokens?.length) return NextResponse.json({ message: "No tokens" });

    // 2. Batch send to Expo
    const messages = tokens.map(t => ({
      to: t.token,
      sound: "default",
      title,
      body,
      data: { type: table, id: record.id }
    }));

    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages.slice(i, i + chunkSize)),
      });
    }

    return NextResponse.json({ success: true, count: tokens.length });
  } catch (err) {
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
