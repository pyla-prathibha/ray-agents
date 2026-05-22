"use client";

interface WaveformProps {
  active: boolean;
  variant?: "blue" | "green";
}

export function Waveform({ active, variant = "blue" }: WaveformProps) {
  return (
    <div
      className={`waveform-container ${variant === "green" ? "green" : ""} ${active ? "active" : ""}`}
    >
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-muted)] z-[2] pointer-events-none">
        AI Voice Stream
      </div>
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="wave-bar" />
      ))}
    </div>
  );
}
