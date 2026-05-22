"use client";

import { useState, useRef, useCallback } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar, type Panel } from "@/components/layout/Sidebar";
import InboundPanel from "@/components/panels/InboundPanel";
import OutboundPanel from "@/components/panels/OutboundPanel";
import DemandGenPanel from "@/components/panels/DemandGenPanel";
import { ToastContainer } from "@/components/shared/ToastContainer";
import { useTheme } from "@/hooks/useTheme";
import { useClock } from "@/hooks/useClock";
import { useToast } from "@/hooks/useToast";

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState<Panel>("inbound");
  const { theme, toggleTheme } = useTheme();
  const clock = useClock();
  const { toasts, showToast } = useToast();
  const mainRef = useRef<HTMLElement>(null);

  const switchPanel = useCallback((panel: Panel) => {
    setActivePanel(panel);
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
    });
  }, []);

  return (
    <>
      <div className="mesh-bg">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />
      </div>
      <div className="dot-grid" />

      <div className="shell">
        <Topbar clock={clock} theme={theme} onToggleTheme={toggleTheme} />
        <Sidebar activePanel={activePanel} onSwitch={switchPanel} />

        <main className="main" ref={mainRef}>
          <div style={{ display: activePanel === "inbound" ? "block" : "none" }}>
            <InboundPanel onToast={showToast} />
          </div>
          <div style={{ display: activePanel === "outbound" ? "block" : "none" }}>
            <OutboundPanel onToast={showToast} />
          </div>
          <div style={{ display: activePanel === "demand" ? "block" : "none" }}>
            <DemandGenPanel onToast={showToast} />
          </div>
        </main>
      </div>

      <ToastContainer toasts={toasts} />
    </>
  );
}
