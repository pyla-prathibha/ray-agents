"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "@/components/shared/ChatSimulator";
import { WebhookDebugger } from "@/components/shared/WebhookDebugger";
import type { TimelineEvent } from "@/components/shared/EventTimeline";
import {
  buildOutboundDialogue,
  QUEUE_PATIENTS,
  SYSTEM_PARAMS,
  CUSTOM_PARAMS,
} from "@/agents/outbound/data";

interface OutboundPanelProps {
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

const STAT_LABELS = ["OPD Consults", "Followed Up", "Booked", "Consent"];

export default function OutboundPanel({ onToast }: OutboundPanelProps) {
  const [phone, setPhone] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");

  const [callStatus, setCallStatus] = useState("Idle");
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  const [events, setEvents] = useState<TimelineEvent[]>(INITIAL_EVENTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [waveActive, setWaveActive] = useState(false);

  const [debugLines, setDebugLines] = useState<string[]>([]);
  const [debugActive, setDebugActive] = useState(false);
  const [debugStatus, setDebugStatus] = useState<"IDLE" | "ACTIVE" | "COMPLETE">("IDLE");

  const [queuePatients, setQueuePatients] = useState([...QUEUE_PATIENTS]);
  const [stats, setStats] = useState({ opdConsults: 1240, followedUp: 142, booked: 68 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ts = () => new Date().toLocaleTimeString("en-IN", { hour12: false });

  const addDebug = useCallback((line: string) => {
    setDebugLines((prev) => [...prev, line]);
  }, []);

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

  const triggerOutboundCall = useCallback(() => {
    if (callActive) return;

    const name = patientName.trim() || "Anjali Sharma";
    const doctor = doctorName.trim() || "Dr. Victor Mag";
    const spec = specialty.trim() || "Dentist";
    const ph = phone.trim() || "9876543210";

    const dialogue = buildOutboundDialogue(name, doctor, spec, ph);

    // Reset state
    setChatMessages([]);
    setEvents([...INITIAL_EVENTS]);
    setDebugLines([]);
    setCallTimer(0);
    setShowTimer(true);
    setCallActive(true);
    setWaveActive(true);
    setDebugActive(true);
    setDebugStatus("ACTIVE");
    setCallStatus("Ringing…");

    // Start timer
    timerRef.current = setInterval(() => {
      setCallTimer((t) => t + 1);
    }, 1000);

    // Event 0: call_initiated
    addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#94a3b8">▸ POST</span> /webhook/outbound`);
    addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#64748b">event:</span> call_initiated`);
    addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#64748b">callee:</span> ${name} | mobile: +91 ${ph}`);
    updateEvent(0, "green", "FIRED", "green");

    // Event 1: call_started (after 1.5s)
    setTimeout(() => {
      setCallStatus("Connected");
      updateEvent(1, "green", "FIRED", "green");
      addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#94a3b8">▸ POST</span> /webhook/outbound`);
      addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#64748b">event:</span> call_started`);
      addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#64748b">doctor:</span> ${doctor} | specialty: ${spec}`);

      // Stream dialogue
      let msgIndex = 0;
      const interval = setInterval(() => {
        if (msgIndex < dialogue.length) {
          const msg = dialogue[msgIndex];
          if (msg.sender === "ai") {
            setShowTyping(true);
            setTimeout(() => {
              setShowTyping(false);
              setChatMessages((prev) => [...prev, msg]);
            }, 600);
          } else {
            setChatMessages((prev) => [...prev, msg]);
          }
          msgIndex++;
        } else {
          clearInterval(interval);

          // Event 2: call_completed
          setTimeout(() => {
            setCallStatus("Completed");
            setWaveActive(false);
            updateEvent(2, "green", "FIRED", "green");
            addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#94a3b8">▸ POST</span> /webhook/outbound`);
            addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#64748b">event:</span> call_completed`);
            addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#64748b">duration:</span> ${dialogue.length * 1.8}s`);

            // Event 3: all_processing_completed
            setTimeout(() => {
              updateEvent(3, "green", "FIRED", "green");
              addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#94a3b8">▸ POST</span> /webhook/outbound`);
              addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#64748b">event:</span> all_processing_completed`);
              addDebug(`<span style="color:#10b981">[${ts()}]</span> <span style="color:#64748b">--- Claude extraction payload ---</span>`);
              addDebug(`<span style="color:#10b981">[${ts()}]</span> callee_name: "${name}"`);
              addDebug(`<span style="color:#10b981">[${ts()}]</span> mobile_number: "+91 ${ph}"`);
              addDebug(`<span style="color:#10b981">[${ts()}]</span> classification: "follow_up_booked"`);
              addDebug(`<span style="color:#10b981">[${ts()}]</span> next_steps: "Saturday 11:30 AM with ${doctor}"`);
              addDebug(`<span style="color:#10b981">[${ts()}]</span> lead_quality: "high"`);
              addDebug(`<span style="color:#10b981">[${ts()}]</span> retry_count: 0`);

              setDebugStatus("COMPLETE");
              setDebugActive(false);
              setCallActive(false);

              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }

              // Update queue patient or prepend new row
              setQueuePatients((prev) => {
                const idx = prev.findIndex((p) => p.name === name);
                if (idx !== -1) {
                  const next = [...prev];
                  next[idx] = { ...next[idx], status: "Booked" };
                  return next;
                }
                return [
                  {
                    id: name.replace(/\s+/g, "-"),
                    name,
                    meta: spec,
                    visit: "Today",
                    cohort: `${spec} Follow-up`,
                    cohortStyle: "green",
                    status: "Booked",
                  },
                  ...prev,
                ];
              });

              setStats((s) => ({
                ...s,
                followedUp: s.followedUp + 1,
                booked: s.booked + 1,
              }));

              onToast(`WhatsApp confirmation sent to ${name} at +91 ${ph}`);
            }, 1200);
          }, 800);
        }
      }, 1800);
    }, 1500);
  }, [callActive, patientName, doctorName, specialty, phone, addDebug, updateEvent, onToast]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const statValues = [stats.opdConsults, stats.followedUp, stats.booked, Math.round((stats.booked / stats.followedUp) * 100)];
  const statSuffixes = ["", "", "", "%"];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Row 1: Header ── */}
      <div className="page-header">
        <div>
          <div className="card-title">
            <span className="eyebrow-dot" style={{ color: "var(--green)", background: "var(--green)" }} />
            Agent 2 · Outbound · Post OPD Follow-Up
          </div>
          <h2 className="page-title">Post OPD Dialler</h2>
          <p className="page-sub">
            Automated follow-up calls for post-OPD patients — schedule reviews, collect feedback, and drive rebookings.
          </p>
          <div className="agent-id-chip">35b9bb7d-c4ea-45eb-95c6-cc31f83e008f</div>
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

      {/* ── Row 2: Trigger + Chat ── */}
      <div className="grid-2">
        {/* Left: Trigger Form */}
        <div className="glow-card dial-card-green">
          <div className="glow-card-inner">
            <div className="dial-label dial-label-green">
              📤 Trigger Outbound Post OPD Call
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                type="text"
                placeholder="Patient Name"
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
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="phone-input green-focus"
                />
              </div>
              <input
                type="text"
                placeholder="Doctor Name"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="text-input"
                style={{ marginBottom: 0 }}
              />
              <input
                type="text"
                placeholder="Specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="text-input"
                style={{ marginBottom: 0 }}
              />
            </div>

            <button
              onClick={triggerOutboundCall}
              disabled={callActive}
              className={`trigger-btn btn-green${callActive ? " loading" : ""}`}
              style={{ marginTop: 16 }}
            >
              {callActive ? `Call Active · ${formatTime(callTimer)}` : "Trigger Outbound Call"}
            </button>

            <div className="webhook-note">
              Webhook endpoint:{" "}
              <code className="code-green">POST</code>{" "}
              <code className="code-green">/api/outbound/trigger</code>
            </div>
          </div>
        </div>

        {/* Right: Waveform + Chat */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--green)" }} />
            Live Call Simulation
            {showTimer && (
              <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 11, color: "var(--green-text)" }}>
                {formatTime(callTimer)}
              </span>
            )}
          </div>
          <div className={`waveform-container green${waveActive ? " active" : ""}`}>
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="wave-bar" />
            ))}
          </div>
          <div className="chat-window">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.sender === "ai" ? "ai green" : "patient green"}`}>
                <span className="sender">{msg.sender === "ai" ? "Ray AI" : "Patient"}</span>
                {msg.text}
              </div>
            ))}
            {showTyping && (
              <div className="chat-bubble ai green">
                <span className="sender">Ray AI</span>
                <span className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Timeline + Debugger ── */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--green)" }} />
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
        <WebhookDebugger lines={debugLines} active={debugActive} status={debugStatus} />
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
            <div className="from-id-row">
              <div className="from-id-chip">
                DID: <span>outbound-ray-prod-01</span>
              </div>
            </div>
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

      {/* ── Row 5: Parameters + Queue ── */}
      <div className="grid-2">
        {/* Left: Input Parameters */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--green)" }} />
            Input Parameters · Per Call
          </div>

          {/* System Params */}
          <div className="param-group-label">System Parameters</div>
          {SYSTEM_PARAMS.map((p) => (
            <div key={p} className="param-item param-item-system">
              <code>{p}</code>
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--green)", color: "#fff", padding: "2px 8px", borderRadius: 6 }}>
                auto
              </span>
            </div>
          ))}

          {/* Custom Params */}
          <div className="param-group-label" style={{ marginTop: 20 }}>Custom Parameters</div>
          {CUSTOM_PARAMS.map((p) => (
            <div key={p} className="param-item param-item-custom">
              <code>{p}</code>
            </div>
          ))}
        </div>

        {/* Right: Follow-Up Queue */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" style={{ background: "var(--green)" }} />
            Post OPD Follow-Up Queue · This Month
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Consult Date</th>
                <th>Cohort</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {queuePatients.map((p) => (
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
