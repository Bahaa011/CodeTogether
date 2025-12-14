import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { EditorFileState } from "../../store/filesSlice";
import { callOpenRouter, type ORChatMessage } from "../../services/chatbot";

type ChatbotRole = "user" | "assistant";

type ChatbotMessage = {
  id: string;
  role: ChatbotRole;
  text: string;
};

let nextChatbotMessageId = 0;
const makeChatbotMessageId = () => `chat-${Date.now()}-${++nextChatbotMessageId}`;

const createChatbotGreeting = (activeFile?: EditorFileState | null) => {
  if (activeFile) {
    return `I can read ${activeFile.filename}. Ask me about this file or any other file you have open in this workspace.`;
  }
  return "Open a file and I can read the code to help you understand it.";
};

const summarizeFile = (activeFile?: EditorFileState | null) => {
  if (!activeFile) return "No file selected.";
  const preview = activeFile.content
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 25)
    .join("\n");
  return `${activeFile.filename} content preview:\n${preview || "(empty file)"}`;
};

const createLocalResponse = (
  question: string,
  activeFile?: EditorFileState | null,
  files: EditorFileState[] = [],
) => {
  if (!activeFile) {
    return "Open a file first so I can inspect its contents and answer your question.";
  }

  const trimmed = question.trim();
  const lines = activeFile.content?.split("\n") ?? [];
  const snippet = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join("\n");
  const lineCount = lines.length;
  const otherFiles = files.filter((file) => file.id !== activeFile.id).length;
  const otherSuffix = otherFiles
    ? ` There are ${otherFiles} other file${otherFiles === 1 ? "" : "s"} open.`
    : "";

  if (!trimmed) {
    return `I have ${activeFile.filename} (${lineCount} lines) open.${otherSuffix}`;
  }

  if (trimmed.toLowerCase().includes("todo")) {
    const todos = lines.filter((line) =>
      line.trim().toLowerCase().includes("todo"),
    );
    if (todos.length) {
      return `I found TODO notes: ${todos.join("; ")}.${otherSuffix}`;
    }
  }

  return `I scanned ${activeFile.filename} (${lineCount} lines). ${
    snippet ? `It begins with:\n${snippet}` : "The file is empty."
  }${otherSuffix}`;
};

const makeSystemPrompt = (activeFile?: EditorFileState | null) => {
  const intro = activeFile
    ? `You are the CodeTogether workspace assistant. The user is currently editing ${activeFile.filename}.`
    : "You are the CodeTogether workspace assistant. No file is currently selected.";
  return `${intro}\n${summarizeFile(activeFile)}\nBe concise and reference the file when answering.`;
};

/**
 * Render chatbot messages with support for Markdown-style fenced code blocks.
 */
const renderMessageContent = (text: string) => {
  const nodes: ReactNode[] = [];
  const codeRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;

  const pushText = (segment: string) => {
    const trimmed = segment.trim();
    if (!trimmed) return;
    const paragraphs = trimmed.split(/\n{2,}/).filter(Boolean);
    paragraphs.forEach((para) => {
      const key = `text-${nodes.length}`;
      const parts: ReactNode[] = [];
      const inlineRegex = /`([^`]+)`/g;
      let last = 0;
      let inlineMatch: RegExpExecArray | null;
      while ((inlineMatch = inlineRegex.exec(para))) {
        if (inlineMatch.index > last) {
          parts.push(para.slice(last, inlineMatch.index));
        }
        parts.push(
          <code key={`${key}-inline-${parts.length}`} className="chatbot-panel__inline-code">
            {inlineMatch[1]}
          </code>,
        );
        last = inlineRegex.lastIndex;
      }
      if (last < para.length) {
        parts.push(para.slice(last));
      }

      nodes.push(
        <p key={key} className="chatbot-panel__paragraph">
          {parts}
        </p>,
      );
    });
  };

  let match: RegExpExecArray | null;
  while ((match = codeRegex.exec(text))) {
    const [full, lang, codeBody] = match;
    const leading = text.slice(lastIndex, match.index);
    pushText(leading);

    const key = `code-${nodes.length}`;
    nodes.push(
      <div key={key} className="chatbot-panel__code-block">
        {lang ? <div className="chatbot-panel__code-lang">{lang}</div> : null}
        <pre>
          <code>{codeBody.trim()}</code>
        </pre>
      </div>,
    );

    lastIndex = match.index + full.length;
  }

  const trailing = text.slice(lastIndex);
  pushText(trailing);
  return nodes.length ? nodes : <p className="chatbot-panel__paragraph">{text}</p>;
};

type ChatbotPanelProps = {
  activeFile?: EditorFileState | null;
  files: EditorFileState[];
};

export default function ChatbotPanel({ activeFile, files }: ChatbotPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ORChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messageListRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: makeChatbotMessageId(),
          role: "assistant",
	          text: createChatbotGreeting(activeFile),
        },
      ];
    });
  }, [activeFile, isOpen]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, loader]);

  const handleToggle = useCallback(() => {
    setIsOpen((previous) => {
      const next = !previous;
      if (next) {
        setConversation([]);
        setError(null);
        setMessages([
          {
            id: makeChatbotMessageId(),
            role: "assistant",
	            text: createChatbotGreeting(activeFile),
          },
        ]);
      }
      return next;
    });
  }, [activeFile]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;

      const userMessage = {
        id: makeChatbotMessageId(),
        role: "user" as const,
        text: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoader(true);
      setError(null);

      const openRouterUserMessage: ORChatMessage = {
        role: "user",
        content: trimmed,
      };
      setConversation((prev) => [...prev, openRouterUserMessage]);

      try {
        const payload = [
	          {
	            role: "system" as const,
	            content: makeSystemPrompt(activeFile),
	          },
          ...conversation,
          openRouterUserMessage,
        ];
        const assistantMessage = await callOpenRouter(payload);
        setConversation((prev) => [...prev, assistantMessage]);
        setMessages((prev) => [
          ...prev,
          {
            id: makeChatbotMessageId(),
            role: "assistant",
            text: assistantMessage.content,
          },
        ]);
      } catch (err) {
        const fallback = createLocalResponse(trimmed, activeFile, files);
        setMessages((prev) => [
          ...prev,
          {
            id: makeChatbotMessageId(),
            role: "assistant",
            text: fallback,
          },
        ]);
        setError(
          err instanceof Error ? err.message : "Unable to reach the chatbot service.",
        );
      } finally {
        setLoader(false);
        setInput("");
      }
    },
    [activeFile, conversation, files, input],
  );

  return (
    <>
      <button
        type="button"
        className="workspace-topbar__button workspace-topbar__button--chatbot"
        onClick={handleToggle}
        aria-pressed={isOpen}
      >
        <span className="workspace-topbar__button-content">
          {isOpen ? "Close Chat" : "Chatbot"}
        </span>
      </button>

      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-live="polite">
          <div className="chatbot-panel__header">
            <div>
              <p className="chatbot-panel__title">Workspace Chatbot</p>
              <p className="chatbot-panel__subtitle">
                Ask the bot about your code and it will read the active file.
              </p>
            </div>
            <button
              type="button"
              className="chatbot-panel__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <ul className="chatbot-panel__messages" ref={messageListRef}>
            {messages.map((message) => (
              <li
                key={message.id}
                className={`chatbot-panel__message chatbot-panel__message--${message.role}`}
              >
                <span className="chatbot-panel__role">
                  {message.role === "assistant" ? "Bot" : "You"}
                </span>
                <div className="chatbot-panel__content">
                  {renderMessageContent(message.text)}
                </div>
              </li>
            ))}
            {loader && (
              <li className="chatbot-panel__message chatbot-panel__message--status">
                Thinking about your code…
              </li>
            )}
          </ul>

          {error && <p className="chatbot-panel__error">{error}</p>}

          <form className="chatbot-panel__form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="chatbot-panel__input"
              placeholder="Ask about the current file..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loader}
            />
            <button
              type="submit"
              className="chatbot-panel__send"
              disabled={loader}
            >
              {loader ? "Thinking…" : "Send"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
