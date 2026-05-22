"use client";

import { useRef, useEffect } from "react";

export interface ChatMessage {
  sender: "ai" | "patient";
  text: string;
}

interface ChatSimulatorProps {
  messages: ChatMessage[];
  showTyping: boolean;
  variant?: "blue" | "green";
  placeholder?: boolean;
}

export function ChatSimulator({
  messages,
  showTyping,
  variant = "blue",
  placeholder = true,
}: ChatSimulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, showTyping]);

  const senderColor = variant === "green" ? "var(--green)" : "var(--blue)";
  const greenClass = variant === "green" ? " green" : "";

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-3 h-[320px] overflow-y-auto scroll-smooth relative rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5"
    >
      {/* Empty state placeholder */}
      {placeholder && messages.length === 0 && !showTyping && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] text-[13px] text-center p-6 pointer-events-none transition-opacity">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-9 h-9 opacity-70"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
            />
          </svg>
          <span>
            Waiting to initiate call simulation...
            <br />
            <small className="opacity-70">
              Trigger a call to see live transcript.
            </small>
          </span>
        </div>
      )}

      {/* Message bubbles */}
      {messages.map((msg, i) => (
        <div key={i} className={`chat-bubble ${msg.sender}${greenClass}`}>
          <span
            className="font-extrabold text-[9.5px] uppercase tracking-wider mb-1 block"
            style={{
              color:
                msg.sender === "ai"
                  ? senderColor
                  : variant === "green"
                    ? "var(--green-text)"
                    : "var(--blue-text)",
            }}
          >
            {msg.sender === "ai" ? "Ray AI" : "Patient"}
          </span>
          {msg.text}
        </div>
      ))}

      {/* Typing indicator */}
      {showTyping && (
        <div
          className={`chat-bubble ai${greenClass}`}
          style={{ animationDelay: "0s" }}
        >
          <span
            className="font-extrabold text-[9.5px] uppercase tracking-wider mb-1 block"
            style={{ color: senderColor }}
          >
            Ray AI
          </span>
          <div className="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  );
}
