"use client";

export type Panel = "inbound" | "outbound" | "reactivation" | "demand";

interface SidebarProps {
  activePanel: Panel;
  onSwitch: (panel: Panel) => void;
}

const NAV_ITEMS: { id: Panel; icon: string; title: string; meta: string; badge: string; badgeClass: string; agent: string }[] = [
  { id: "inbound", icon: "📞", title: "Apt Booking · Inbound", meta: "Patient booking calls", badge: "Live", badgeClass: "badge-blue", agent: "inbound" },
  { id: "outbound", icon: "📤", title: "Post Booking · Outbound", meta: "Post-booking follow-ups", badge: "Live", badgeClass: "badge-green", agent: "outbound" },
  { id: "reactivation", icon: "🔄", title: "Reactivation · Outbound", meta: "Dormant patient calls", badge: "Live", badgeClass: "badge-green", agent: "outbound" },
  { id: "demand", icon: "📊", title: "Demand Gen · Report", meta: "Monthly growth metrics", badge: "May", badgeClass: "badge-purple", agent: "demand" },
];

export function Sidebar({ activePanel, onSwitch }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-label">AI Agents</div>

      {NAV_ITEMS.map((nav) => (
        <button
          key={nav.id}
          data-agent={nav.agent}
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


      <div className="sidebar-footer">
        <div className="sf-label">Powered By</div>
        <div className="sf-id">Practo · Ray AI Agents</div>
      </div>
    </nav>
  );
}
