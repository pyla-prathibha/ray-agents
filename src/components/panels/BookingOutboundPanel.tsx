"use client";

import { useState, useCallback, useRef } from "react";
import type { TimelineEvent } from "@/components/shared/EventTimeline";

interface BookingOutboundPanelProps {
  onToast: (msg: string) => void;
}

const INITIAL_EVENTS: TimelineEvent[] = [
  { name: "call_initiated", dot: "muted", time: "--:--:--", status: "WAITING", statusColor: "muted" },
  { name: "call_started", dot: "muted", time: "--:--:--", status: "WAITING", statusColor: "muted" },
  { name: "call_completed", dot: "muted", time: "--:--:--", status: "WAITING", statusColor: "muted" },
  { name: "all_processing_completed", dot: "muted", time: "--:--:--", status: "WAITING", statusColor: "muted" },
];

const PILL_CLASS: Record<string, string> = {
  Booked: "pill pill-booked",
  Called: "pill pill-called",
  Queued: "pill pill-pending",
  Voicemail: "pill pill-voicemail",
};

const COHORT_STYLE: Record<string, React.CSSProperties> = {
  purple: { background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" },
  blue: { background: "var(--blue-light)", color: "var(--blue-text)", border: "1px solid var(--blue-mid)" },
  orange: { background: "rgba(251,191,36,0.12)", color: "#f59e0b", border: "1px solid rgba(251,191,36,0.25)" },
  green: { background: "var(--green-light)", color: "var(--green-text)", border: "1px solid var(--green-mid)" },
};

const STAT_LABELS = ["Booking Calls", "Answered", "Confirmed", "Conversion Rate"];

const QUEUE_PATIENTS = [
  { id: "Aarav-Mehta", name: "Aarav Mehta", meta: "Inquiry: Root Canal", visit: "Today", cohort: "New Inquiry", cohortStyle: "purple", status: "Booked" },
  { id: "Meera-Nair", name: "Meera Nair", meta: "Inquiry: Dental Crown", visit: "Yesterday", cohort: "Lead Follow-up", cohortStyle: "blue", status: "Called" },
  { id: "Aditya-Reddy", name: "Aditya Reddy", meta: "Inquiry: Invisalign", visit: "Yesterday", cohort: "High Intent", cohortStyle: "orange", status: "Queued" },
  { id: "Zara-Khan", name: "Zara Khan", meta: "Inquiry: Teeth Cleaning", visit: "2 days ago", cohort: "General Inquiry", cohortStyle: "green", status: "Booked" },
];

export default function BookingOutboundPanel({ onToast }: BookingOutboundPanelProps) {
  const [phone, setPhone] = useState("");
  const [patientName, setPatientName] = useState("");

  const [callStatus, setCallStatus] = useState("Idle");
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  const [events, setEvents] = useState<TimelineEvent[]>(INITIAL_EVENTS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ts = () => new Date().toLocaleTimeString("en-IN", { hour12: false });

  const updateEvent = useCallback(
    (index: number, dot: TimelineEvent["dot"], status: string, statusColor: TimelineEvent["statusColor"]) => {
      setEvents((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], dot, time: ts(), status, statusColor };
        return next;
      });
    },
    []
  );

  // Poll for live webhook events
  const pollCallEvents = useCallback(
    (callId: string) => {
      let lastEventCount = 0;
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/calls/events?call_id=${callId}`);
          const data = await res.json();
          if (!data.success || !data.call) return;

          const call = data.call;
          const events = call.events || [];

          // Process new events
          for (let i = lastEventCount; i < events.length; i++) {
            const ev = events[i];
            const eventType = ev.event_type;
            const eventIdx = INITIAL_EVENTS.findIndex((e) => e.name === eventType);

            if (eventIdx !== -1) {
              updateEvent(eventIdx, "green", "RECEIVED", "green");
            }

            if (eventType === "call_started") {
              setCallStatus("Connected");
            }

            if (eventType === "call_completed") {
              setCallStatus(ev.sub_status === "VOICEMAIL_DETECTED" ? "Voicemail" : "Completed");
            }
          }
          lastEventCount = events.length;

          // Stop polling when call is done
          if (call.status === "completed" || call.status === "failed" || call.status === "voicemail") {
            setTimeout(() => {
              clearInterval(pollInterval);
              setCallActive(false);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setShowTimer(false);
            }, 15000);
          }
        } catch {
          // Polling error — continue silently
        }
      }, 2000);

      return pollInterval;
    },
    [updateEvent]
  );

  const triggerOutboundInboundCall = useCallback(async () => {
    if (callActive) return;

    const name = patientName.trim() || "Patient";
    const ph = phone.trim();

    if (!ph || ph.replace(/\D/g, "").length < 10) {
      onToast("Enter a valid 10-digit phone number");
      return;
    }

    // Reset state
    setEvents([...INITIAL_EVENTS]);
    setCallTimer(0);
    setShowTimer(true);
    setCallActive(true);
    setCallStatus("Initiating...");

    // Start timer
    timerRef.current = setInterval(() => {
      setCallTimer((t) => t + 1);
    }, 1000);

    try {
      const res = await fetch("/api/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: name,
          mobile_number: ph.replace(/\D/g, ""),
          agent_type: "inbound",
        }),
      });

      const data = await res.json();

      if (data.success && data.call_id) {
        setCallStatus("Ringing...");
        updateEvent(0, "green", "INITIATED", "green");

        // Start polling for live webhook events
        const interval = pollCallEvents(data.call_id);

        return () => {
          if (interval) clearInterval(interval);
        };
      } else {
        throw new Error(data.error || "Call initiation failed");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setCallStatus("Failed");
      setCallActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onToast(`Call failed: ${msg}`);
    }
  }, [callActive, patientName, phone, onToast, pollCallEvents, updateEvent]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const statValues = [840, 612, 495, 81];
  const statSuffixes = ["", "", "", "%"];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Row 1: Header ── */}
      <div className="page-header">
        <div>
          <div className="card-title">
            <span className="eyebrow-dot" style={{ color: "var(--blue)", background: "var(--blue)" }} />
            Agent 1 · Outbound Dialer · Inbound Booking Agent
          </div>
          <h2 className="page-title">Apt Booking Dialer</h2>
          <p className="page-sub">
            Trigger outbound calls to route patients directly to the Ray Inbound AI Booking Agent receptionist flow.
          </p>
        </div>
        <div className="call-status-card">
          <span className="eyebrow-dot" style={{
            color: callActive ? "var(--green)" : "var(--text-muted)",
            background: callActive ? "var(--green)" : "var(--text-muted)",
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{callStatus}</span>
          {showTimer && (
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--green-text)" }}>
              {formatTime(callTimer)}
            </span>
          )}
        </div>
      </div>

      {/* ── Row 2: Trigger Form (Full Width) ── */}
      <div>
        <div className="glow-card dial-card-green" style={{ width: "100%" }}>
          <div className="glow-card-inner">
            <div className="dial-label dial-label-green">
              ☎️ Trigger Inbound Booking Outbound Call
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <input
                type="text"
                placeholder="Patient Name (e.g. Rohan Mehta)"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="text-input"
                style={{ marginBottom: 0 }}
              />
              <div className="phone-input-wrap" style={{ marginBottom: 0 }}>
                <span className="cc-green" style={{ display: "flex", alignItems: "center", padding: "0 12px", borderRadius: 14, fontWeight: 700, fontSize: 13 }}>
                  +91
                </span>
                <input
                  type="text"
                  placeholder="Phone Number (e.g. 9988776655)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="phone-input green-focus"
                />
              </div>
            </div>

            <button
              onClick={triggerOutboundInboundCall}
              disabled={callActive}
              className={`trigger-btn btn-green${callActive ? " loading" : ""}`}
              style={{ marginTop: 16 }}
            >
              {callActive ? `Call Active · ${formatTime(callTimer)}` : "Trigger Inbound Booking Call"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 3: Event Timeline (Full Width) ── */}
      <div>
        <div className="card" style={{ width: "100%" }}>
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--blue)" }} />
            Event Timeline
          </div>
          <div className="event-log">
            {events.map((ev, i) => (
              <div key={i} className="event-row">
                <span
                  className="event-dot"
                  style={{
                    background: ev.dot === "green" ? "var(--green)" : "var(--text-muted)",
                    boxShadow: ev.dot === "green" ? "0 0 8px var(--green)" : "none",
                  }}
                />
                <span className="event-name">{ev.name}</span>
                <span className="event-time">{ev.time}</span>
                <span
                  className="event-status"
                  style={{
                    color: ev.statusColor === "green" ? "var(--green-text)" : "var(--text-muted)",
                  }}
                >
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Calling From + Stats ── */}
      <div className="grid-2">
        {/* Left: Calling From Hero */}
        <div className="glow-card from-number-hero">
          <div className="glow-card-inner" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12 }}>
            <div className="from-icon">📞</div>
            <div className="from-label">Calling From</div>
            <div className="from-number-text">+91 22 6809 5634</div>
            <div className="from-sub">Verified outbound number</div>

          </div>
        </div>

        {/* Right: Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {STAT_LABELS.map((label, i) => (
            <div key={label} className="stat-chip">
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: 6 }}>
                {statValues[i].toLocaleString()}{statSuffixes[i]}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 5: Queue ── */}
      <div>
        <div className="card" style={{ width: "100%" }}>
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--blue)" }} />
            Inbound Call Queue · This Month
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Call Date</th>
                <th>Cohort</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {QUEUE_PATIENTS.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="patient-name">{p.name}</div>
                    <div className="patient-meta">{p.meta}</div>
                  </td>
                  <td>
                    <span className="last-visit">{p.visit}</span>
                  </td>
                  <td>
                    <span
                      className="flow-badge"
                      style={COHORT_STYLE[p.cohortStyle] || COHORT_STYLE.green}
                    >
                      {p.cohort}
                    </span>
                  </td>
                  <td>
                    <span className={PILL_CLASS[p.status] || "pill pill-pending"}>
                      {p.status}
                    </span>
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
