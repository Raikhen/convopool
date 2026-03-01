import { NextResponse } from "next/server";
import { uploadConversation } from "@/lib/storage";
import type { ConversationPayload, Platform } from "@/lib/types";

const VALID_PLATFORMS: Platform[] = ["chatgpt", "claude", "grok", "gemini"];
const MAX_PAYLOAD_BYTES = 1_000_000; // 1MB

export async function POST(request: Request) {
  // Parse and validate body
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (rawBody.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: ConversationPayload;
  try {
    body = JSON.parse(rawBody) as ConversationPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body.conversation_id ||
    !body.platform ||
    !Array.isArray(body.turns) ||
    body.turns.length === 0 ||
    !body.captured_at ||
    !body.extension_version
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!VALID_PLATFORMS.includes(body.platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  for (const turn of body.turns) {
    if (!turn.role || !turn.content || !["user", "assistant", "system"].includes(turn.role)) {
      return NextResponse.json({ error: "Invalid turn format" }, { status: 400 });
    }
  }

  // Enrich and upload directly to HuggingFace
  const enriched = {
    ...body,
    server_received_at: new Date().toISOString(),
    num_turns: body.turns.length,
  };

  try {
    await uploadConversation(enriched);
  } catch (err) {
    console.error("HF upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }

  return NextResponse.json({ status: "accepted", conversation_id: body.conversation_id });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
