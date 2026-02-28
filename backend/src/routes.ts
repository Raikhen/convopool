import { Hono } from "hono";
import { config } from "./config.js";
import { uploadConversation } from "./storage.js";
import type { ConversationPayload, EnrichedConversation } from "./types.js";

const routes = new Hono();

routes.get("/health", (c) => {
  return c.json({ status: "ok" });
});

routes.post("/conversations", async (c) => {
  // Auth check
  const apiKey = c.req.header("X-API-Key");
  if (apiKey !== config.API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Parse and validate body
  let body: ConversationPayload;
  try {
    body = await c.req.json<ConversationPayload>();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (
    !body.conversation_id ||
    !body.platform ||
    !Array.isArray(body.turns) ||
    body.turns.length === 0 ||
    !body.captured_at ||
    !body.extension_version
  ) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  for (const turn of body.turns) {
    if (!turn.role || !turn.content || !["user", "assistant", "system"].includes(turn.role)) {
      return c.json({ error: "Invalid turn format" }, 400);
    }
  }

  // Enrich and upload directly to HuggingFace
  const enriched: EnrichedConversation = {
    ...body,
    server_received_at: new Date().toISOString(),
    num_turns: body.turns.length,
  };

  try {
    await uploadConversation(enriched);
  } catch (err) {
    console.error("HF upload failed:", err);
    return c.json({ error: "Upload failed" }, 502);
  }

  return c.json({ status: "accepted", conversation_id: body.conversation_id });
});

export { routes };
