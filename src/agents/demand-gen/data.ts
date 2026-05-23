export const NARRATIVES = [
  "Practo and Google Business drove 77% of bookings this month while ad spend dropped 22% \u2014 meaning every rupee worked harder. Video Shorts is your fastest-growing channel at 4.2K views per clip; doubling content output here could shift 10\u201315 more bookings per month at near-zero marginal cost.",
  "Cost per lead fell to \u20b9290 \u2014 the lowest in 6 months \u2014 thanks to improved Practo listing quality and geo-fenced Meta creatives. WhatsApp broadcasts showed a 1-booking result this month; the segment is under-tested and worth a larger opt-in push next cycle.",
  "Return on spend hit 2.4\u00d7 this month, up from 1.7\u00d7 in April. The PRP video short drove 4.2K organic views \u2014 auto-clipped content is now outperforming paid ads on a per-rupee basis. Recommend shifting 15% of Meta budget to content production next month.",
];

export const CHANNELS = [
  { icon: "\ud83d\udccb", name: "Practo Listing", desc: "Photos · FAQ · auto-bid", bookings: 22, pct: 47, colorVar: "--blue-text", gradient: "linear-gradient(90deg,#2563eb,#3b82f6)" },
  { icon: "\ud83d\udccd", name: "Google Business", desc: "Posts · review replies", bookings: 14, pct: 30, colorVar: "--orange-text", gradient: "linear-gradient(90deg,#d97706,#f59e0b)" },
  { icon: "\ud83c\udfaf", name: "Meta + Google Ads", desc: "Geo-fenced creatives", bookings: 7, pct: 15, colorVar: "--purple-text", gradient: "linear-gradient(90deg,#7c3aed,#8b5cf6)" },
  { icon: "\ud83c\udfac", name: "Video Shorts", desc: "Auto-clipped from consults", bookings: 3, pct: 6, colorVar: "--cyan-text", gradient: "linear-gradient(90deg,#0891b2,#06b6d4)" },
  { icon: "\ud83d\udcac", name: "WhatsApp Broadcasts", desc: "Segmented · opt-in", bookings: 1, pct: 2, colorVar: "--green-text", gradient: "linear-gradient(90deg,#059669,#10b981)" },
];

export const CONTENT_PUBLISHED = [
  { type: "Video Short · 32 Sec", title: "\"How CAD/CAM dental crowns are made in 1 day\"", metric: "Auto-clipped · 4.2K views", badge: "video" },
  { type: "Google Post", title: "\"Why laser root canals are virtually pain-free\"", metric: "Auto-written · 78 saves", badge: "post" },
  { type: "Meta Carousel", title: "\"Rahul's Invisalign smile journey at Koramangala\"", metric: "Attributed · CTR +34%", badge: "carousel" },
  { type: "Video Short · 45 Sec", title: "\"The truth about dental implant pain — patient review\"", metric: "Auto-clipped · 8.9K views", badge: "video" },
  { type: "Google Post", title: "\"Understanding Invisalign vs traditional metal braces\"", metric: "Auto-written · 142 saves", badge: "post" },
];

export const WHY_DOCTORS = [
  { icon: "\ud83e\udde0", title: "One brain, five channels", desc: "No fragmented agencies \u2014 same insight runs all your marketing." },
  { icon: "\ud83c\udfac", title: "Doctor content, auto-made", desc: "Short videos clipped from your consults (with consent) \u2014 no studio, no scripts." },
  { icon: "\ud83d\udcca", title: "Every patient attributed", desc: "You see exactly which channel brought which booking. No more guessing." },
  { icon: "\ud83d\udcb0", title: "Pay for results", desc: "CPA-style billing. You pay when a real attributed patient walks in \u2014 not for retainers." },
];
