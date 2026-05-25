"use client";

import { useState, useCallback, useRef } from "react";
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
  const [recentCalls, setRecentCalls] = useState([...RECENT_CALLS]);
  const [stats, setStats] = useState({ calls: 18, responded: 14, booked: 9, pending: 2 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

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
    setEvents(makeInitialEvents());

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timeouts.push(setTimeout(fn, ms));
    };

    schedule(() => {
      if (abortRef.current) return;
      fireEvent(0, "blue", "Fired", "blue");
      setCallStatus({ label: "Ringing", color: "var(--blue)" });
    }, 1000);

    schedule(() => {
      if (abortRef.current) return;
      setCallStatus({ label: "Connected", color: "var(--green-text)" });
      startTimer();

      let delay = 0;
      INBOUND_DIALOGUE.forEach((line) => {
        if (line.sender === "ai") {
          const typingStart = delay;
          const showBubble = delay + 2000;
          const waveOff = showBubble + 3500;

          delay = waveOff + 500;
        } else {
          const showBubble = delay + 1500;
          const waveOff = showBubble + 2500;

          delay = waveOff + 500;
        }
      });

      schedule(() => {
        if (abortRef.current) return;
        stopTimer();
        setCallStatus({ label: "Completed", color: "var(--green-text)" });
        setCallActive(false);

        fireEvent(1, "green", "Fired", "green");

        schedule(() => {
          fireEvent(2, "green", "Fired", "green");
        }, 800);

        schedule(() => {
          fireEvent(3, "green", "Fired", "green");

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
  }, [phone, onToast, fireEvent, startTimer, stopTimer]);

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
            Simulate an inbound patient call to test the AI receptionist flow, Ray booking engine, and webhook pipeline.
          </p>
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

      {/* ── Row 2 · Dial Card (Full Width) ── */}
      <div>
        {/* Dial Card */}
        <div className="glow-card dial-card" style={{ width: "100%" }}>
          <div className="glow-card-inner">
            <div className="dial-label dial-label-blue">
              <span className="card-title-dot" style={{ background: "var(--blue)" }} />
              Dial Inbound Call
            </div>

            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📞</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 800, color: "var(--blue-text)", letterSpacing: "0.03em", marginBottom: "8px" }}>
                +91 80311 37408
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Patients call this number to book appointments.<br />
                Ray AI handles the conversation automatically.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3 · Timeline (Full Width) ── */}
      <div>
        {/* Event Timeline */}
        <div className="card" style={{ width: "100%" }}>
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
