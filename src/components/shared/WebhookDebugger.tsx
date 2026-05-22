"use client";

import { useRef, useEffect } from "react";

interface WebhookDebuggerProps {
  lines: string[];
  active: boolean;
  status: "IDLE" | "ACTIVE" | "COMPLETE";
}

export function WebhookDebugger({
  lines,
  active,
  status,
}: WebhookDebuggerProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="debugger-card">
      <div className="debugger-header">
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#94a3b8]">
          <div className={`debugger-dot ${active ? "active" : ""}`} />
          Claude API Webhook Receiver Logger
        </div>
        <span className="text-[9.5px] text-[#64748b] font-bold font-mono">
          STATUS: {status}
        </span>
      </div>
      <div
        ref={bodyRef}
        className="debugger-body"
        dangerouslySetInnerHTML={{
          __html:
            lines.length > 0
              ? lines.join("\n")
              : "Waiting for RingAI webhook events to stream payload logging...",
        }}
      />
    </div>
  );
}
