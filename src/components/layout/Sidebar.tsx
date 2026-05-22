"use client";

export type Panel = "inbound" | "outbound" | "demand";

interface SidebarProps {
  activePanel: Panel;
  onSwitch: (panel: Panel) => void;
}

const NAV_ITEMS: { id: Panel; icon: string; title: string; meta: string; badge: string; badgeClass: string }[] = [
  { id: "inbound", icon: "📞", title: "Apt Booking · Inbound", meta: "Patient booking calls", badge: "Live", badgeClass: "badge-blue" },
  { id: "outbound", icon: "📤", title: "Post OPD · Outbound", meta: "Post-consultation calls", badge: "8%", badgeClass: "badge-green" },
  { id: "demand", icon: "📊", title: "Demand Gen · Report", meta: "Monthly growth metrics", badge: "May", badgeClass: "badge-purple" },
];

export function Sidebar({ activePanel, onSwitch }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-label">AI Agents</div>

      {NAV_ITEMS.map((nav) => (
        <button
          key={nav.id}
          data-agent={nav.id}
          className={`nav-item ${activePanel === nav.id ? "active" : ""}`}
          onClick={() => onSwitch(nav.id)}
        >
          <div className="nav-icon">{nav.icon}</div>
          <div className="nav-item-text">
            <div className="nav-item-title">{nav.title}</div>
            <div className="nav-meta">{nav.meta}</div>
          </div>
          <span className={`nav-badge ${nav.badgeClass}`}>{nav.badge}</span>
        </button>
      ))}

      <div className="sidebar-label">Platform</div>
      <div className="sidebar-section">
        <div className="env-card">
          <div className="env-card-label">AI Model</div>
          <div className="env-card-val">Claude Sonnet 4.6</div>
        </div>
        <div className="env-card">
          <div className="env-card-label">Voice Provider</div>
          <div className="env-card-val">Ray AI Voice Engine</div>
        </div>
        <div className="env-card">
          <div className="env-card-label">Booking Engine</div>
          <div className="env-card-val" style={{ color: "var(--blue-text)", fontWeight: 600 }}>Ray · Practo</div>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sf-label">Powered By</div>
        <div className="sf-id">Ray · Practo AI Agents</div>
      </div>
    </nav>
  );
}
