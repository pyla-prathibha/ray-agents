// ── Metric File Types ──

export interface SearchTrends {
  keyword: string;
  mom_growth_pct: number;
  volume_trend: string;
  category: string;
  top_related_searches: string[];
}

export interface GeoIntent {
  radius_km: number;
  monthly_queries_in_radius: number;
  high_intent_suburbs: string[];
  target_demographics: {
    age_range: string;
    gender_split: {
      male_pct: number;
      female_pct: number;
    };
  };
}

export interface CompetitorDensity {
  competitors_within_2km: number;
  average_competitor_rating: number;
  top_competitor_weaknesses: string[];
  our_price_positioning: string;
}

export interface DoctorSignal {
  nps_score: number;
  nps_classification: string;
  completed_hair_cases_monthly: number;
  average_rating_star: number;
  key_success_factors: string[];
}

// ── Claude Demand Gen Output ──

export interface DemandGenAnalysis {
  analyzed_signals: {
    high_intent_keywords: string[];
    market_opportunity_score: number;
    competitor_threat_level: "Low" | "Medium" | "High";
  };
  platforms: {
    practo_optimization: string;
    google_business_profile: string;
    meta_google_ads: string;
    doctor_video_shorts: string[];
    whatsapp_broadcast: string;
  };
  growth_report_narrative: string;
}



// ── Webhook Types ──

export interface RingAIWebhookPayload {
  call_id: string;
  event_type: string;
  call_type?: "inbound" | "outbound";
  status?: string;
  sub_status?: string;
  retry_count?: number;
  call_disconnect_reason?: string;
  transcript?: { role: string; content: string }[];
  recording_url?: string;
  custom_args_values?: Record<string, string>;
  platform_analysis?: {
    classification?: string;
    callback_requested?: boolean;
    summary?: string;
  };
  client_analysis?: {
    lead_quality?: "high" | "medium" | "low";
    next_action?: "follow_up" | "close";
    intent_score?: number;
  };
}

export type AgentType = "inbound" | "outbound" | "demand";
