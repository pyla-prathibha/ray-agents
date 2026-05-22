"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { INBOUND_DIALOGUE, INBOUND_EVENTS, RECENT_CALLS } from "@/agents/inbound/data";

interface InboundPanelProps {
  onToast: (msg: string) => void;
}

interface TimelineEvent {
  name: string;
  dot: "muted" | "blue" | "green";
  time: string;
  status: string;
  statusColor: "muted" | "blue" | "green";
}

interface ChatMessage {
  sender: "ai" | "patient";
  text: string;
}

function makeInitialEvents(): TimelineEvent[] {
  return INBOUND_EVENTS.map((name) => ({
    name,
    dot: "muted" as const,
    time: "--:--:--",
    status: "Waiting",
    statusColor: "muted" as const,
  }));
}

function ts(): string {
  return new Date().toLocaleTimeString("en-IN", { hour12: false });
}

export default function InboundPanel({ onToast }: InboundPanelProps) {
  const [phone, setPhone] = useState("");
  const [callStatus, setCallStatus] = useState<{ label: string; color: string }>({
    label: "Idle",
    color: "var(--text-muted)",
  });
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState("00:00");
  const [showTimer, setShowTimer] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>(makeInitialEvents);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const [debugActive, setDebugActive] = useState(false);
  const [debugStatus, setDebugStatus] = useState<"IDLE" | "ACTIVE" | "COMPLETE">("IDLE");
  const [recentCalls, setRecentCalls] = useState([...RECENT_CALLS]);
  const [stats, setStats] = useState({ calls: 18, responded: 14, booked: 9, pending: 2 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showTyping]);

  const addDebug = useCallback((line: string) => {
    setDebugLines((prev) => [...prev, line]);
  }, []);

  const fireEvent = useCallback(
    (index: number, dot: "blue" | "green", statusLabel: string, statusColor: "blue" | "green") => {
      setEvents((prev) =>
        prev.map((ev, i) =>
          i === index ? { ...ev, dot, time: ts(), status: statusLabel, statusColor } : ev
        )
      );
    },
    []
  );

  const startTimer = useCallback(() => {
    let secs = 0;
    setShowTimer(true);
    setCallTimer("00:00");
    timerRef.current = setInterval(() => {
      secs++;
      const m = String(Math.floor(secs / 60)).padStart(2, "0");
      const s = String(secs % 60).padStart(2, "0");
      setCallTimer(`${m}:${s}`);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const triggerCall = useCallback(() => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      onToast("Enter a valid 10-digit phone number");
      return;
    }

    abortRef.current = false;

    setCallActive(true);
    setCallStatus({ label: "Connecting...", color: "var(--blue)" });
    setChatMessages([]);
    setShowTyping(false);
    setWaveActive(false);
    setEvents(makeInitialEvents());
    setDebugLines([]);
    setDebugActive(true);
    setDebugStatus("ACTIVE");

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timeouts.push(setTimeout(fn, ms));
    };

    schedule(() => {
      if (abortRef.current) return;
      fireEvent(0, "blue", "Fired", "blue");
      setCallStatus({ label: "Ringing", color: "var(--blue)" });
      addDebug(
        `<span style="color:var(--blue)">[${ts()}]</span> <span style="color:var(--blue-text)">POST</span> /webhook/inbound → <b>call_started</b> ring_group=reception`
      );
    }, 1000);

    schedule(() => {
      if (abortRef.current) return;
      setCallStatus({ label: "Connected", color: "var(--green-text)" });
      startTimer();
      addDebug(
        `<span style="color:var(--green)">[${ts()}]</span> <span style="color:var(--green-text)">CONNECTED</span> stream_id=strm_${Math.random().toString(36).slice(2, 8)}`
      );

      let delay = 0;
      INBOUND_DIALOGUE.forEach((line) => {
        if (line.sender === "ai") {
          const typingStart = delay;
          const showBubble = delay + 2000;
          const waveOff = showBubble + 3500;

          schedule(() => {
            if (abortRef.current) return;
            setShowTyping(true);
            setWaveActive(true);
          }, typingStart);

          schedule(() => {
            if (abortRef.current) return;
            setShowTyping(false);
            setChatMessages((prev) => [...prev, { sender: "ai", text: line.text }]);
          }, showBubble);

          schedule(() => {
            if (abortRef.current) return;
            setWaveActive(false);
          }, waveOff);

          delay = waveOff + 500;
        } else {
          const showBubble = delay + 1500;
          const waveOff = showBubble + 2500;

          schedule(() => {
            if (abortRef.current) return;
            setWaveActive(true);
            setChatMessages((prev) => [...prev, { sender: "patient", text: line.text }]);
          }, showBubble);

          schedule(() => {
            if (abortRef.current) return;
            setWaveActive(false);
          }, waveOff);

          delay = waveOff + 500;
        }
      });

      schedule(() => {
        if (abortRef.current) return;
        stopTimer();
        setCallStatus({ label: "Completed", color: "var(--green-text)" });
        setCallActive(false);

        fireEvent(1, "green", "Fired", "green");
        addDebug(
          `<span style="color:var(--green)">[${ts()}]</span> <span style="color:var(--green-text)">POST</span> /webhook/inbound → <b>call_completed</b> duration=3m14s`
        );

        schedule(() => {
          fireEvent(2, "green", "Fired", "green");
          addDebug(
            `<span style="color:var(--green)">[${ts()}]</span> <span style="color:var(--green-text)">POST</span> /webhook/inbound → <b>recording_completed</b> size=1.4MB`
          );
        }, 800);

        schedule(() => {
          fireEvent(3, "green", "Fired", "green");
          addDebug(
            `<span style="color:var(--green)">[${ts()}]</span> <span style="color:var(--green-text)">POST</span> /webhook/inbound → <b>all_processing_completed</b>`
          );
          addDebug("");
          addDebug(
            `<span style="color:var(--blue-text)">[Claude Extraction]</span> <span style="color:var(--text-secondary)">` +
              JSON.stringify(
                {
                  intent: "appointment_booking",
                  doctor: "Dr. Victor Mag",
                  slot: "Sat May 23, 10:30 AM",
                  patient_phone: `+91 ${phone}`,
                  confidence: 0.97,
                },
                null,
                2
              ).replace(/\n/g, "<br/>") +
              `</span>`
          );

          setDebugActive(false);
          setDebugStatus("COMPLETE");

          setRecentCalls((prev) => [
            {
              num: `+91 ${phone.replace(/(\d{5})(\d{5})/, "$1 $2")}`,
              time: new Date().toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              dur: "3m 14s",
              cls: "appointment_booked",
              status: "Booked",
            },
            ...prev,
          ]);

          setStats((prev) => ({
            calls: prev.calls + 1,
            responded: prev.responded + 1,
            booked: prev.booked + 1,
            pending: prev.pending,
          }));

          onToast("Inbound call completed — appointment booked via Dhanvantri");
        }, 1600);
      }, delay);
    }, 2200);

    return () => {
      abortRef.current = true;
      timeouts.forEach(clearTimeout);
      stopTimer();
    };
  }, [phone, onToast, fireEvent, addDebug, startTimer, stopTimer]);

  const pillClass = (status: string) => {
    if (status === "Booked" || status === "Done") return "pill pill-booked";
    if (status === "Pending") return "pill pill-pending";
    return "pill";
  };

  const eventStatusStyle = (sc: "muted" | "blue" | "green") => {
    if (sc === "blue") return { background: "var(--blue-light)", color: "var(--blue-text)", border: "1px solid var(--blue-mid)" };
    if (sc === "green") return { background: "var(--green-light)", color: "var(--green-text)", border: "1px solid var(--green-mid)" };
    return { background: "var(--surface-3)", color: "var(--text-muted)", border: "1px solid var(--border)" };
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Row 1 · Page Header ── */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow" style={{ color: "var(--blue)" }}>
            <span className="eyebrow-dot" style={{ background: "var(--blue)", color: "var(--blue)" }} />
            Agent 1 &middot; Inbound &middot; Apt Booking
          </div>
          <h2 className="page-title">Patient Call Trigger</h2>
          <p className="page-sub">
            Simulate an inbound patient call to test the AI receptionist flow, Dhanvantri booking engine, and webhook pipeline.
          </p>
          <div className="agent-id-chip">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 14, height: 14, opacity: 0.6 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
            TBD - Credentials Shared Later
          </div>
        </div>
        <div className="call-status-card">
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "6px 14px",
              borderRadius: "10px",
              border: "1px solid",
              color: callStatus.color,
              borderColor: callStatus.color,
              background:
                callStatus.label === "Idle"
                  ? "var(--surface-2)"
                  : callStatus.label === "Completed"
                    ? "var(--green-light)"
                    : "var(--blue-light)",
            }}
          >
            {callStatus.label}
          </span>
          {showTimer && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
              {callTimer}
            </span>
          )}
        </div>
      </div>

      {/* ── Row 2 · Dial + Chat ── */}
      <div className="grid-2">
        {/* Dial Card */}
        <div className="glow-card dial-card">
          <div className="glow-card-inner">
            <div className="dial-label dial-label-blue">
              <span className="card-title-dot" style={{ background: "var(--blue)" }} />
              Dial Inbound Call
            </div>

            <div className="phone-input-wrap">
              <div className="country-code cc-blue">
                <span style={{ marginRight: 6 }}>🇮🇳</span> +91
              </div>
              <input
                type="tel"
                className="phone-input"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <button
              onClick={triggerCall}
              disabled={callActive}
              className={`trigger-btn btn-blue${callActive ? " loading" : ""}`}
            >
              {callActive && <span className="spinner" />}
              {callActive ? "Call in Progress..." : "Trigger Inbound Call"}
            </button>

            <div className="webhook-note">
              Webhook will POST to{" "}
              <code className="code-blue">/api/webhook/inbound</code>{" "}
              with call events streamed in real-time.
            </div>
          </div>
        </div>

        {/* Waveform + Chat Card */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--blue)" }} />
            Live Call Transcript
          </div>

          {/* Waveform */}
          <div className={`waveform-container${waveActive ? " active" : ""}`}>
            <span className="waveform-label">Waveform</span>
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="wave-bar" />
            ))}
          </div>

          {/* Chat */}
          <div className="chat-window">
            {chatMessages.length === 0 && !showTyping && (
              <div className="chat-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                </svg>
                Trigger a call to see the live transcript
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.sender === "ai" ? "ai" : "patient"}`}>
                <span className="sender">{msg.sender === "ai" ? "Ray AI" : "Patient"}</span>
                {msg.text}
              </div>
            ))}

            {showTyping && (
              <div className="chat-bubble ai">
                <span className="sender">Ray AI</span>
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* ── Row 3 · Timeline + Debugger ── */}
      <div className="grid-2">
        {/* Event Timeline */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--blue)" }} />
            Webhook Event Timeline
          </div>
          <div className="event-log">
            {events.map((ev, i) => (
              <div key={i} className="event-row">
                <div className={`event-dot ${ev.dot}`} />
                <span className="event-name">{ev.name}</span>
                <span className="event-time">{ev.time}</span>
                <span className="event-status" style={eventStatusStyle(ev.statusColor)}>
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Debugger */}
        <div className="card debugger-card">
          <div className="debugger-header">
            <div className="debugger-title">
              <span className={`debugger-dot${debugActive ? " active" : ""}`} />
              Webhook Debugger
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: debugStatus === "ACTIVE" ? "#38bdf8" : debugStatus === "COMPLETE" ? "#6ee7b7" : "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {debugStatus}
            </span>
          </div>
          <div className="debugger-body">
            {debugLines.length === 0 && (
              <span style={{ color: "#64748b" }}>Waiting for webhook events...</span>
            )}
            {debugLines.map((line, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4 · Stats + Recent Calls ── */}
      <div className="grid-2">
        {/* Stats Card */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--blue)" }} />
            Today &middot; Inbound Stats
          </div>
          <div className="stats-mini-grid">
            {[
              { label: "Total Calls", value: stats.calls, color: "var(--blue)" },
              { label: "Responded", value: stats.responded, color: "var(--green-text)" },
              { label: "Booked", value: stats.booked, color: "var(--green)" },
              { label: "Pending", value: stats.pending, color: "var(--orange-text)" },
            ].map((s) => (
              <div key={s.label} className="stats-mini-item">
                <div className="stats-mini-val" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="stats-mini-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Calls Table */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--blue)" }} />
            Recent Inbound Calls
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Phone</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((row, i) => (
                <tr key={`${row.num}-${i}`}>
                  <td className="phone-mono">{row.num}</td>
                  <td>{row.time}</td>
                  <td>{row.dur}</td>
                  <td>
                    <span className={pillClass(row.status)}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
