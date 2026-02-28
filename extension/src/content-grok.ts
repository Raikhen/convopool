import type { ExtractedConversation, Message } from "./types";

function extractConversation(): ExtractedConversation {
  const turns: Message[] = [];

  // Grok uses message containers with role indicators.
  // Try data-testid attributes first.
  const userMessages = document.querySelectorAll('[data-testid="user-message"]');
  const aiMessages = document.querySelectorAll('[data-testid="ai-message"], [data-testid="assistant-message"]');

  if (userMessages.length > 0 || aiMessages.length > 0) {
    const allMessages: { element: Element; role: Message["role"] }[] = [];

    userMessages.forEach((el) => {
      allMessages.push({ element: el, role: "user" });
    });

    aiMessages.forEach((el) => {
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

  // Fallback: Grok renders conversations in message-row containers
  // with distinguishable user vs assistant sections
  if (turns.length === 0) {
    const messageRows = document.querySelectorAll('[class*="message"], [class*="Message"], [role="article"]');
    messageRows.forEach((el) => {
      const content = el.textContent?.trim() || "";
      if (!content) return;

      // Detect role by looking for avatar/name indicators or class patterns
      const isUser = el.querySelector('[class*="user"], [class*="User"], [data-testid*="user"]') !== null ||
        el.classList.toString().toLowerCase().includes("user");
      turns.push({
        role: isUser ? "user" : "assistant",
        content,
      });
    });
  }

  // Second fallback: look for turn-based alternating structure
  if (turns.length === 0) {
    const containers = document.querySelectorAll('[class*="turn"], [class*="Turn"], [class*="response"], [class*="query"]');
    containers.forEach((el, index) => {
      const content = el.textContent?.trim() || "";
      if (content) {
        const isQuery = el.classList.toString().toLowerCase().includes("query") ||
          el.classList.toString().toLowerCase().includes("human");
        turns.push({
          role: isQuery || index % 2 === 0 ? "user" : "assistant",
          content,
        });
      }
    });
  }

  // Try to detect model name
  let model: string | undefined;
  const modelSelector = document.querySelector('[data-testid="model-selector"], [class*="model-selector"], [class*="ModelSelector"]');
  if (modelSelector?.textContent) {
    model = modelSelector.textContent.trim();
  }
  if (!model) {
    // Grok may show model name in a header or dropdown
    const header = document.querySelector('header, [class*="header"]');
    const modelMatch = header?.textContent?.match(/Grok[\s-]?\d*/i);
    if (modelMatch) {
      model = modelMatch[0].trim();
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
