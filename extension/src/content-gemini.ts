import type { ExtractedConversation, Message } from "./types";

function cleanModelName(raw: string): string {
  return raw
    .trim()
    .replace(/^(Model:\s*|Using\s+)/i, "")
    .slice(0, 100)
    .trim();
}

/** Recursively query through Shadow DOM boundaries. */
function deepQuerySelectorAll(root: Document | Element | ShadowRoot, selector: string): Element[] {
  const results: Element[] = Array.from(root.querySelectorAll(selector));
  // Traverse shadow roots
  const allElements = Array.from(root.querySelectorAll("*"));
  for (const el of allElements) {
    if (el.shadowRoot) {
      results.push(...deepQuerySelectorAll(el.shadowRoot, selector));
    }
  }
  return results;
}

function extractConversation(): ExtractedConversation {
  const turns: Message[] = [];

  // Primary: Gemini wraps each turn in a container with data-turn-role attributes
  const userTurns = deepQuerySelectorAll(document, '[data-turn-role="user"]');
  const modelTurns = deepQuerySelectorAll(document, '[data-turn-role="model"]');

  if (userTurns.length > 0 || modelTurns.length > 0) {
    const allMessages: { element: Element; role: Message["role"] }[] = [];

    userTurns.forEach((el) => {
      allMessages.push({ element: el, role: "user" });
    });

    modelTurns.forEach((el) => {
      allMessages.push({ element: el, role: "assistant" });
    });

    // Sort by DOM order (reliable regardless of scroll position)
    allMessages.sort((a, b) => {
      const pos = a.element.compareDocumentPosition(b.element);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    for (const msg of allMessages) {
      const content = msg.element.textContent?.trim() || "";
      if (content) {
        turns.push({ role: msg.role, content });
      }
    }
  }

  // Fallback 1: Look for message-content custom elements inside user-query / model-response ancestors
  if (turns.length === 0) {
    const messageContents = deepQuerySelectorAll(document, "message-content");
    messageContents.forEach((el) => {
      const content = el.textContent?.trim() || "";
      if (!content) return;

      const isUser = el.closest('[class*="user-query"], [class*="query-content"]') !== null;
      const isModel = el.closest('[class*="model-response"], [class*="response-content"]') !== null;
      turns.push({
        role: isUser ? "user" : "assistant",
        content,
      });
    });
  }

  // Fallback 2: Query class-based containers with heuristic role detection
  if (turns.length === 0) {
    const containers = deepQuerySelectorAll(document, '[class*="query"], [class*="response"]');
    containers.forEach((el) => {
      const content = el.textContent?.trim() || "";
      if (!content) return;

      const classes = el.classList.toString().toLowerCase();
      const isQuery = classes.includes("query") && !classes.includes("response");
      turns.push({
        role: isQuery ? "user" : "assistant",
        content,
      });
    });
  }

  // Try to detect model name
  let model: string | undefined;

  // Primary: model dropdown button in Gemini's prompt bar
  const switchButtons = deepQuerySelectorAll(document, "button.input-area-switch");
  for (const btn of switchButtons) {
    const text = btn.textContent?.trim();
    if (text && text.length < 80) {
      model = cleanModelName(text);
      break;
    }
  }

  // Fallback: class-based model selector elements
  if (!model) {
    const modelSelector = deepQuerySelectorAll(document, '[class*="model"], .model-selector, [class*="ModelSelector"]');
    for (const el of modelSelector) {
      const text = el.textContent?.trim();
      if (text && /gemini/i.test(text) && text.length < 80) {
        model = cleanModelName(text);
        break;
      }
    }
  }

  // Fallback: parse document title (matches "Gemini 2.5 Flash", "2.5 Pro", etc.)
  if (!model) {
    const titleMatch = document.title.match(/(?:Gemini[\s-]?)?[\d.]+\s*(?:Pro|Ultra|Flash|Nano)/i)
      || document.title.match(/Gemini[\s-]?[\d.]*(?: Pro| Ultra| Flash| Nano)?/i);
    if (titleMatch) {
      model = cleanModelName(titleMatch[0]);
    }
  }

  return { turns, model };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "extract-conversation") {
    const data = extractConversation();
    sendResponse(data);
  }
  return true;
});
