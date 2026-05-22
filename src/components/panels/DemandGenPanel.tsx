import { useState, useCallback, useEffect, useRef } from "react";
import { WHY_DOCTORS } from "@/agents/demand-gen/data";
import { type ClinicDashboardData } from "@/services/demandGen";

interface DemandGenPanelProps {
  onToast: (msg: string) => void;
}

const CHANNEL_META: Record<string, { icon: string; name: string; desc: string }> = {
  practo_listing: { icon: "📋", name: "Practo Listing", desc: "Photos · FAQ · auto-bid" },
  google_business: { icon: "📍", name: "Google Business", desc: "Posts · review replies" },
  meta_google_ads: { icon: "🎯", name: "Meta + Google Ads", desc: "Geo-fenced creatives" },
  video_shorts: { icon: "🎬", name: "Video Shorts", desc: "Auto-clipped from consults" },
  whatsapp_broadcasts: { icon: "💬", name: "WhatsApp Broadcasts", desc: "Segmented · opt-in" },
};

const CHANNEL_COLORS: Record<string, string> = {
  practo_listing: "var(--blue-text)",
  google_business: "var(--orange-text)",
  meta_google_ads: "var(--purple-text)",
  video_shorts: "var(--cyan-text)",
  whatsapp_broadcasts: "var(--green-text)",
};

const BADGE_CLASS: Record<string, string> = {
  video: "type-video",
  post: "type-post",
  carousel: "type-carousel",
};

const getChannelMetrics = (key: string, baseline: number) => {
  switch (key) {
    case "practo_listing":
      return {
        current: baseline,
        projected: Math.round(baseline * 1.35),
        lift: "+35%",
        unit: baseline === 1 ? "txn" : "txns",
        currentLabel: "Current",
        projectedLabel: "With Ray AI"
      };
    case "google_business":
      return {
        current: Math.round(baseline * 0.45),
        projected: Math.round(baseline * 0.45 * 1.60),
        lift: "+60%",
        unit: "bookings",
        currentLabel: "Current",
        projectedLabel: "With Ray AI"
      };
    case "meta_google_ads":
      return {
        current: Math.round(baseline * 0.15),
        projected: Math.round(baseline * 0.15 * 2.50),
        lift: "+150%",
        unit: "bookings",
        currentLabel: "Current",
        projectedLabel: "With Ray AI"
      };
    case "video_shorts":
      return {
        current: 0,
        projected: Math.round(baseline * 0.12),
        lift: "NEW",
        unit: "bookings",
        currentLabel: "Current",
        projectedLabel: "With Ray AI"
      };
    case "whatsapp_broadcasts":
      return {
        current: Math.round(baseline * 0.08),
        projected: Math.round(baseline * 0.08 * 2.72),
        lift: "+172%",
        unit: "bookings",
        currentLabel: "Current",
        projectedLabel: "With Ray AI"
      };
    default:
      return {
        current: 0,
        projected: 0,
        lift: "0%",
        unit: "bookings",
        currentLabel: "Current",
        projectedLabel: "With Ray AI"
      };
  }
};

export default function DemandGenPanel({ onToast }: DemandGenPanelProps) {
  const [clinicId, setClinicId] = useState("");
  const [clinicIdInput, setClinicIdInput] = useState("");
  const [data, setData] = useState<ClinicDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadClinicData = useCallback(async (id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/data?clinicId=${encodeURIComponent(id.trim())}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch clinic data: ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        onToast("Clinic insights fetched successfully ✓");
      } else {
        throw new Error(json.error || "Failed to fetch clinic data");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Fetch request aborted.");
        return;
      }
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
      onToast("Error fetching clinic insights");
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [onToast]);

  useEffect(() => {
    if (clinicId.trim()) {
      loadClinicData(clinicId);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clinicId, loadClinicData]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      onToast("Fetch cancelled by user");
    }
    setLoading(false);
  };
  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    if (clinicIdInput.trim()) {
      setClinicId(clinicIdInput.trim());
    }
  };

  const report = data?.report;
  const ch = report?.channels;

  // Calculate top signal metrics
  const totalDocs = data?.doctors.length || 0;
  const validSatisfactions = data?.doctors.map((d) => d.reviews.percentage).filter((p) => p > 0) || [];
  const avgSatisfaction = validSatisfactions.length > 0
    ? Math.round(validSatisfactions.reduce((s, p) => s + p, 0) / validSatisfactions.length)
    : 94;
  const totalReviews = data?.doctors.reduce((sum, doc) => sum + (doc.reviews.response_count || 0), 0) || 0;
  const competitorCount = data?.competitors.total_clinics_in_radius || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ── HEADER ── */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow" style={{ color: "var(--purple-text)" }}>
            <span className="eyebrow-dot" style={{ background: "var(--purple)", color: "var(--purple)" }} />
            Agent 3 &middot; Demand Generation
          </div>
          <div className="page-title">Clinic Demand Dashboard</div>
          <div className="page-sub">
            May 2026 &middot; Live market signal analysis & local competitor benchmarking
          </div>
        </div>
      </div>

      {/* ── CLINIC CONFIGURATION BAR ── */}
      <div className="card" style={{ padding: "18px 24px" }}>
        <form onSubmit={handleFetch} style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label className="input-label" style={{ margin: 0 }}>Active Clinic Configuration ID</label>
              {clinicIdInput !== "c9d8655e-90c2-42f1-9ab8-f5cc214e8aea" && (
                <button
                  type="button"
                  onClick={() => {
                    setClinicIdInput("c9d8655e-90c2-42f1-9ab8-f5cc214e8aea");
                    setClinicId("c9d8655e-90c2-42f1-9ab8-f5cc214e8aea");
                  }}
                  style={{
                    fontSize: "10px",
                    color: "var(--purple-text)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                    fontWeight: 600
                  }}
                >
                  {clinicIdInput ? "Reset to Demo Clinic" : "Load Demo Clinic"}
                </button>
              )}
            </div>
            <input
              type="text"
              className="text-input"
              value={clinicIdInput}
              onChange={(e) => setClinicIdInput(e.target.value)}
              placeholder="Enter Practo Clinic ID..."
              style={{
                margin: 0,
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                borderWidth: "1px",
                padding: "10px 14px",
                borderRadius: "10px"
              }}
            />
          </div>
          <button
            type={loading ? "button" : "submit"}
            className="generate-btn"
            onClick={loading ? handleCancel : undefined}
            style={{
              height: "42px",
              padding: "0 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12.5px",
              background: loading ? "var(--red)" : undefined,
              borderColor: loading ? "var(--red)" : undefined,
            }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ marginRight: "8px" }} />
                Stop Fetching
              </>
            ) : (
              <>⚡ Fetch Insights</>
            )}
          </button>
        </form>
      </div>

      {/* ── EMPTY / PROMPT STATE ── */}
      {!data && !loading && !error && (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <div style={{ fontSize: "40px" }}>📊</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
            No Active Clinic Loaded
          </div>
          <div style={{ fontSize: "13.5px", color: "var(--text-muted)", maxWidth: "480px", lineHeight: "1.6" }}>
            Enter a Practo Clinic Configuration ID above and click <strong>Fetch Insights</strong> to analyze live market signals and local competitor benchmarking.
          </div>
          <button
            type="button"
            className="generate-btn"
            onClick={() => {
              setClinicIdInput("c9d8655e-90c2-42f1-9ab8-f5cc214e8aea");
              setClinicId("c9d8655e-90c2-42f1-9ab8-f5cc214e8aea");
            }}
            style={{ fontSize: "12px", padding: "8px 18px", background: "rgba(124, 77, 255, 0.08)", border: "1px solid rgba(124, 77, 255, 0.2)", color: "var(--purple-text)", boxShadow: "none" }}
          >
            Use Demo Clinic ID
          </button>
        </div>
      )}

      {/* ── LOADING STATE ── */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div className="ai-thinking" style={{ justifyContent: "center", marginBottom: "16px" }}>
            <span className="ai-thinking-dot" />
            <span className="ai-thinking-dot" />
            <span className="ai-thinking-dot" />
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Fetching live clinic details, matching doctors, parsing competitor CSV, and running AI generation...
          </div>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {error && !loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px 24px", borderColor: "var(--red)" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--red-text)", marginBottom: "8px" }}>
            Failed to Load Clinic Data
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
            {error}
          </div>
          <button
            className="generate-btn"
            onClick={() => loadClinicData(clinicId)}
            style={{ margin: "0 auto", padding: "8px 18px", fontSize: "12px", background: "var(--red)" }}
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* ── REPORT RESULTS ── */}
      {data && !loading && !error && (
        <>
          {/* Active Profile Title Bar */}
          <div className="card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                📊 <span style={{ color: "var(--purple-text)", fontWeight: 800 }}>Clinic Demand Generation Profile</span> &middot; {data.clinic.name}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Locality: <strong style={{ color: "var(--text-2)" }}>{data.clinic.locality || "Koramangala"}</strong> &middot; {data.clinic.address}, {data.clinic.city}
              </div>
            </div>
            <div className="status-live" style={{ fontSize: "11px" }}>
              <div className="pulse" />
              Connected to Practo Bridge
            </div>
          </div>

          <div className="demand-layout">
            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* SIGNAL CARDS */}
              <div className="grid-4">
                <div className="metric-card blue">
                  <div className="metric-label">Total Doctors</div>
                  <div className="metric-val blue">{totalDocs}</div>
                  <div className="metric-delta delta-up">★ Active Providers</div>
                </div>
                <div className="metric-card orange">
                  <div className="metric-label">Patient Satisfaction</div>
                  <div className="metric-val orange">{avgSatisfaction}%</div>
                  <div className="metric-delta delta-up">↑ Recommended NPS</div>
                </div>
                <div className="metric-card red">
                  <div className="metric-label">Total Reviews</div>
                  <div className="metric-val red">{totalReviews || 120}</div>
                  <div className="metric-delta delta-up">✓ Verified Feedbacks</div>
                </div>
                <div className="metric-card cyan">
                  <div className="metric-label">Local Competitors</div>
                  <div className="metric-val cyan">{competitorCount}</div>
                  <div className="metric-delta delta-dn">↓ In {data.clinic.locality || "Koramangala"}</div>
                </div>
              </div>

              {/* DOCTOR NPS LEADERBOARD TABLE */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: "16px" }}>
                  <span className="card-title-dot" style={{ background: "var(--purple)" }} />
                  Doctor NPS Leaderboard
                </div>
                {data.doctors.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                    No doctor profile records linked to this clinic.
                  </div>
                ) : (
                  <>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Doctor Info</th>
                            <th>Qualifications</th>
                            <th>Experience</th>
                            <th>Consultation Fee</th>
                            <th>NPS Rating</th>
                            <th>Total Reviews</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllDoctors ? data.doctors : data.doctors.slice(0, 5)).map((doc) => (
                            <tr key={doc.id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  {doc.photo ? (
                                    <img
                                      src={doc.photo}
                                      alt={doc.name}
                                      style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }}
                                    />
                                  ) : (
                                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--purple-light)", color: "var(--purple-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>
                                      {doc.name.substring(4, 5) || "D"}
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "13px" }}>{doc.name}</div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{doc.speciality}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                  {doc.qualifications.map((q, i) => (
                                    <span key={i} className="pill" style={{ background: "var(--surface-3)", color: "var(--text-2)", textTransform: "none", letterSpacing: 0, padding: "2px 6px" }}>
                                      {q}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600 }}>{doc.experience}</span>
                              </td>
                              <td>
                                <span style={{ fontWeight: 600, color: "var(--green-text)" }}>
                                  {doc.consultation_fee ? `₹${doc.consultation_fee}` : "₹100"}
                                </span>
                              </td>
                              <td>
                                <span className="pill" style={{
                                  background: doc.reviews.percentage >= 90 ? "var(--green-light)" : "var(--orange-light)",
                                  color: doc.reviews.percentage >= 90 ? "var(--green-text)" : "var(--orange-text)",
                                  border: `1px solid ${doc.reviews.percentage >= 90 ? "var(--green-mid)" : "var(--orange-mid)"}`
                                }}>
                                  {doc.reviews.percentage}% NPS
                                </span>
                              </td>
                              <td>
                                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{doc.reviews.response_count}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {data.doctors.length > 5 && (
                      <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                        <button
                          type="button"
                          onClick={() => setShowAllDoctors(!showAllDoctors)}
                          style={{
                            background: "rgba(124, 77, 255, 0.08)",
                            border: "1px solid rgba(124, 77, 255, 0.2)",
                            color: "var(--purple-text)",
                            fontWeight: 700,
                            fontSize: "12px",
                            padding: "8px 18px",
                            borderRadius: "20px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(124, 77, 255, 0.15)";
                            e.currentTarget.style.borderColor = "rgba(124, 77, 255, 0.35)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(124, 77, 255, 0.08)";
                            e.currentTarget.style.borderColor = "rgba(124, 77, 255, 0.2)";
                          }}
                        >
                          {showAllDoctors ? "Collapse to Top 5" : `View All ${data.doctors.length} Doctors`}
                          <span style={{ fontSize: "10px" }}>{showAllDoctors ? "▲" : "▼"}</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* LOCAL COMPETITOR BENCHMARK */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: "16px" }}>
                  <span className="card-title-dot" style={{ background: "var(--red)" }} />
                  Local Competitor Benchmark
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Target Locality</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>
                      {data.competitors.top_competitors[0]?.locality || data.clinic.locality || "Koramangala"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Competitor Clinics</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--red-text)" }}>{data.competitors.total_clinics_in_radius} Clinics</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Avg Competitor NPS</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--orange-text)" }}>★ {data.competitors.avg_rating} / 5</div>
                  </div>
                </div>

                {data.competitors.top_competitors.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
                    No local competitors found in transaction registry.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {data.competitors.top_competitors.map((comp) => (
                      <div key={comp.rank} className="channel-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: comp.rank === 1 ? "var(--orange-mid)" : comp.rank === 2 ? "var(--blue-mid)" : "var(--surface-3)",
                            color: comp.rank === 1 ? "var(--orange-text)" : comp.rank === 2 ? "var(--blue-text)" : "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "12px"
                          }}>
                            #{comp.rank}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "13.5px" }}>{comp.practice_name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              Lead: {comp.doctor_name} &middot; {comp.experience} exp
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, color: "var(--text)" }}>
                            {comp.specialty_txns !== undefined ? comp.specialty_txns : comp.monetisable_txns} Dental Txns
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                            {comp.is_heuristic ? "Estimated" : "Real Breakout"} &middot; {comp.monetisable_txns} overall
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5 CHANNELS */}
              <div>
                <div className="section-label">5 Channels Managed For You</div>
                <div className="grid-5">
                  {ch &&
                    Object.entries(ch).map(([key, val]) => {
                      const meta = CHANNEL_META[key];
                      if (!meta) return null;
                      const baseline = (data?.our_monetisable_txns && data.our_monetisable_txns > 0) ? data.our_monetisable_txns : 271;
                      const metrics = getChannelMetrics(key, baseline);
                      return (
                        <div key={key} className="channel-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div className="channel-card-icon">{meta.icon}</div>
                              <span className="pill" style={{
                                fontSize: "8.5px",
                                background: metrics.lift === "NEW" ? "var(--purple-light)" : "var(--green-light)",
                                color: metrics.lift === "NEW" ? "var(--purple-text)" : "var(--green-text)",
                                border: `1px solid ${metrics.lift === "NEW" ? "var(--purple-mid)" : "var(--green-mid)"}`,
                                padding: "2px 6px",
                                fontWeight: 800
                              }}>
                                {metrics.lift}
                              </span>
                            </div>
                            <div className="channel-card-name">{meta.name}</div>
                            <div className="channel-card-desc" style={{ marginBottom: "12px", minHeight: "26px" }}>{meta.desc}</div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: "auto" }}>
                            <div style={{ background: "var(--surface-2)", padding: "6px 8px", borderRadius: "10px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>{metrics.currentLabel}</span>
                              <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{metrics.current}</span>
                              <span style={{ fontSize: "8px", color: "var(--text-muted)", opacity: 0.8 }}>{metrics.unit}</span>
                            </div>
                            <div style={{ background: "var(--green-light)", padding: "6px 8px", borderRadius: "10px", border: "1px solid var(--green-mid)", display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "8px", color: "var(--green-text)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>{metrics.projectedLabel}</span>
                              <span style={{ fontSize: "13px", fontWeight: 800, color: CHANNEL_COLORS[key], fontFamily: "var(--font-mono)" }}>{metrics.projected}</span>
                              <span style={{ fontSize: "8px", color: "var(--text-muted)", opacity: 0.8 }}>{metrics.unit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* CONTENT AUTO-PUBLISHED */}
              <div>
                <div className="section-label">Content Auto-Published This Month</div>
                <div className="grid-3">
                  {report?.content_published.map((item, idx) => (
                    <div key={idx} className="content-tile">
                      <span className={`content-tile-badge ${BADGE_CLASS[item.badge] || ""}`}>{item.type}</span>
                      <div className="content-tile-body">
                        <div className="content-tile-title">{item.title}</div>
                      </div>
                      <div className="content-tile-footer">
                        <span>{item.metric}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLAUDE NARRATIVE */}
              {report?.growth_report_narrative && (
                <div className="glow-card narrative-box">
                  <div className="glow-card-inner">
                    <div className="narrative-header">✨ Ray AI Analysis Playbook</div>
                    <p className="narrative-text">{report.growth_report_narrative}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* WHAT YOU GET */}
              <div className="value-card-highlight">
                <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", opacity: 0.85 }}>What You Get</div>
                <div className="value-card-highlight-val">+20&ndash;40%</div>
                <div className="value-card-highlight-sub">
                  New patient appointments every month &mdash; at <strong>2&ndash;3&times; the ROI</strong> of a typical marketing agency.
                </div>
              </div>



              {/* DENTIST SEARCH TRENDS */}
              <div className="card">
                <div className="card-title">
                  <span className="card-title-dot" style={{ background: "var(--blue)" }} />
                  Bangalore Search Trends
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Monthly Searches</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--blue-text)" }}>
                      {data.searchTrends.total_dental_searches_bangalore.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>MoM Growth</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--green-text)" }}>
                      +{data.searchTrends.mom_growth_pct}%
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}>
                  {data.searchTrends.top_keywords.slice(0, 5).map((k, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--surface-2)", borderRadius: "10px", fontSize: "11.5px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{k.keyword}</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className="pill" style={{ fontSize: "8px", background: "var(--blue-light)", color: "var(--blue-text)", border: "1px solid var(--blue-mid)", textTransform: "none", padding: "2px 6px" }}>
                          {k.intent}
                        </span>
                        <span style={{ fontWeight: 700, color: "var(--text-2)" }}>{k.monthly_searches}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LOCALITY INTENT */}
              <div className="card">
                <div className="card-title">
                  <span className="card-title-dot" style={{ background: "var(--green)" }} />
                  Locality Breakdowns
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                  {data.geoIntent.localities.map((loc, i) => {
                    const isCurrentLocality = loc.name.toLowerCase() === (data.clinic.locality || "koramangala").toLowerCase();
                    return (
                      <div key={i} style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        padding: "10px 14px",
                        background: isCurrentLocality ? "var(--purple-light)" : "var(--surface-2)",
                        border: isCurrentLocality ? "1px solid var(--purple-mid)" : "1px solid transparent",
                        borderRadius: "12px",
                        position: "relative"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 800, color: isCurrentLocality ? "var(--purple-text)" : "var(--text)", fontSize: "12.5px" }}>{loc.name}</span>
                            {isCurrentLocality && (
                              <span className="pill" style={{ fontSize: "8px", background: "var(--purple-mid)", color: "var(--purple-text)", textTransform: "uppercase", padding: "2px 6px" }}>
                                Current
                              </span>
                            )}
                          </div>
                          <span style={{ fontWeight: 700, color: "var(--text-2)", fontSize: "12px" }}>{loc.monthly_dental_searches} searches</span>
                        </div>
                        <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                          Top: <code style={{ color: "var(--text-2)" }}>"{loc.top_keyword}"</code>
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted-darker)", fontStyle: "italic" }}>
                          {loc.demo}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* WHY DOCTORS LOVE IT */}
              <div className="value-card">
                <div className="section-label">Why Doctors Love It</div>
                {WHY_DOCTORS.map((item, idx) => (
                  <div key={idx} className="why-item">
                    <div className="why-icon">{item.icon}</div>
                    <div>
                      <div className="why-title">{item.title}</div>
                      <div className="why-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <div className="status-live" style={{ fontSize: "12px" }}>
                  <div className="pulse" />
                  Connected &middot; Active
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
