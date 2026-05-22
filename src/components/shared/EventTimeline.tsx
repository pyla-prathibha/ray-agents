"use client";

export interface TimelineEvent {
  name: string;
  dot: "muted" | "blue" | "green" | "orange";
  time: string;
  status: string;
  statusColor?: "muted" | "blue" | "green";
}

interface EventTimelineProps {
  events: TimelineEvent[];
  accentColor?: string;
}

export function EventTimeline({
  events,
  accentColor = "var(--blue)",
}: EventTimelineProps) {
  return (
    <div className="bg-[var(--surface-blur)] backdrop-blur-[20px] border border-[var(--border)] rounded-[20px] p-6 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] hover:border-[var(--border-2)] hover:-translate-y-0.5">
      <div className="text-[11.5px] font-extrabold tracking-[0.1em] uppercase text-[var(--text-muted)] mb-5 flex items-center gap-2.5">
        <span
          className="w-1 h-[15px] rounded-sm"
          style={{ background: accentColor }}
        />
        Webhook Event Timeline
      </div>
      <div className="event-log">
        {events.map((ev, i) => (
          <div key={i} className="event-row">
            <div className={`event-dot ${ev.dot}`} />
            <span
              className="font-mono text-[11.5px] flex-1 font-semibold transition-colors"
              style={{
                color:
                  ev.dot === "muted"
                    ? "var(--text-muted)"
                    : ev.statusColor === "green"
                      ? "var(--green-text)"
                      : "var(--blue-text)",
              }}
            >
              {ev.name}
            </span>
            <span className="font-mono text-[10.5px] text-[var(--text-muted)]">
              {ev.time}
            </span>
            <span
              className="text-[9.5px] font-extrabold px-2.5 py-[3px] rounded-md uppercase tracking-wider"
              style={{
                background:
                  ev.statusColor === "green"
                    ? "var(--green-light)"
                    : ev.statusColor === "blue"
                      ? "var(--blue-light)"
                      : "var(--surface-3)",
                color:
                  ev.statusColor === "green"
                    ? "var(--green-text)"
                    : ev.statusColor === "blue"
                      ? "var(--blue-text)"
                      : "var(--text-muted)",
              }}
            >
              {ev.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
