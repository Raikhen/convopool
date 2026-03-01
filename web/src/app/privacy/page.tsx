import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ConvoPool",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-teal-50 text-slate-800">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a
          href="/"
          className="mb-8 inline-block text-sm text-teal-700 hover:underline"
        >
          &larr; Back to home
        </a>

        <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-10 text-sm text-slate-500">
          Effective date: February 28, 2026
        </p>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">
              What is ConvoPool?
            </h2>
            <p>
              ConvoPool is a Chrome extension that lets you voluntarily share
              your AI chat conversations with a public dataset for AI safety
              research. It is entirely opt-in — nothing is collected unless you
              explicitly click &ldquo;Share.&rdquo;
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">
              Data We Collect
            </h2>
            <p>When you choose to share a conversation, we collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>The conversation text (user and assistant messages)</li>
              <li>The platform name (ChatGPT, Claude, Grok, or Gemini)</li>
              <li>The model name (if available on the page)</li>
              <li>A randomly generated conversation ID (not linked to you)</li>
              <li>A timestamp of when you shared</li>
              <li>The extension version number</li>
            </ul>
            <p className="mt-3 font-medium">We do not collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Your name, email, or any personal identifiers</li>
              <li>Cookies or browsing history</li>
              <li>Your account information on any AI platform</li>
              <li>Any data from pages outside the supported AI chat platforms</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">
              When Data Is Collected
            </h2>
            <p>
              Data is collected <strong>only</strong> when you explicitly click
              the &ldquo;Share&rdquo; button in the extension popup. The
              extension never sends data automatically or in the background.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">
              Where Data Is Stored
            </h2>
            <p>
              Shared conversations are appended to a public HuggingFace dataset
              at{" "}
              <a
                href="https://huggingface.co/datasets/Raikhen/convopool-data"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 underline underline-offset-2 hover:text-teal-900"
              >
                Raikhen/convopool-data
              </a>
              . Because this dataset is public, anyone can view the shared
              conversations. Do not share conversations containing personal or
              sensitive information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">
              Chrome Extension Permissions
            </h2>
            <p>The extension requests the following permissions:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>storage</strong> — to remember your consent choice and
                to maintain an offline retry queue for failed uploads.
              </li>
              <li>
                <strong>scripting</strong> — to inject content scripts that read
                the conversation from the chat page when you click Share.
              </li>
              <li>
                <strong>Host permissions</strong> (chatgpt.com, claude.ai,
                grok.com, gemini.google.com, convopool.vercel.app) — to read the
                chat DOM on supported platforms and to upload shared
                conversations to our API.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">
              Your Control
            </h2>
            <p>
              Sharing is entirely voluntary and opt-in. You can stop using the
              extension at any time by removing it from Chrome. Since no personal
              identifiers are collected, shared conversations cannot be traced
              back to you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">
              Contact
            </h2>
            <p>
              If you have questions or concerns, please open an issue on our{" "}
              <a
                href="https://github.com/Raikhen/convopool/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 underline underline-offset-2 hover:text-teal-900"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
