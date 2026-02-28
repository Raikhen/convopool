import type { ExtractedConversation, Message } from "./types";

function extractConversation(): ExtractedConversation {
  const turns: Message[] = [];

  // Claude uses [data-testid="user-message"] for user turns
  // and [data-testid="ai-message"] for assistant turns.
  // Messages appear in DOM order within the conversation container.
  const userMessages = document.querySelectorAll('[data-testid="user-message"]');
  const aiMessages = document.querySelectorAll('[data-testid="ai-message"]');

  // Collect all messages with their DOM position for correct ordering
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

  // If data-testid selectors didn't work, try alternative selectors
  if (turns.length === 0) {
    // Fallback: Claude renders human messages in .human-turn and assistant in .ai-turn,
    // or uses role-based wrappers. Try a broad approach.
    const messageGroups = document.querySelectorAll('[data-is-streaming], .font-claude-message, .font-user-message');
    messageGroups.forEach((el) => {
      const content = el.textContent?.trim() || "";
      if (content) {
        // Heuristic: if it's inside an element with claude/assistant indicators
        const isAssistant = el.closest('[data-is-streaming]') !== null ||
          el.classList.contains('font-claude-message');
        turns.push({
          role: isAssistant ? "assistant" : "user",
          content,
        });
      }
    });
  }

  // Second fallback: look for the conversation thread structure
  if (turns.length === 0) {
    const threadMessages = document.querySelectorAll('.min-h-\\[20px\\], [class*="Message"], [class*="message"]');
    threadMessages.forEach((el, index) => {
      const content = el.textContent?.trim() || "";
      if (content) {
        turns.push({
          role: index % 2 === 0 ? "user" : "assistant",
          content,
        });
      }
    });
  }

  // Try to detect model name
  let model: string | undefined;
  // Claude shows the model name in the model selector or header
  const modelSelector = document.querySelector('[data-testid="model-selector"] button, [data-testid="model-picker"] button');
  if (modelSelector?.textContent) {
    model = modelSelector.textContent.trim();
  }
  // Fallback: check for model name in common header areas
  if (!model) {
    const modelEl = document.querySelector('.model-name, [class*="ModelSelector"], [class*="model-selector"]');
    if (modelEl?.textContent) {
      model = modelEl.textContent.trim();
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
  return true; // Keep message channel open for async response
});
