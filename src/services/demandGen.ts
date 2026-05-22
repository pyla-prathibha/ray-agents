import { callClaude } from "./claude";
import { config } from "@/config";
import { fetchEstablishment, fetchProvider, searchDoctors, type PractoEstablishment, type PractoDoctor } from "./practoApi";

export interface Competitor {
  rank: number;
  practice_name: string;
  doctor_name: string;
  locality: string;
  speciality: string;
  experience: string;
  review_count: number;
  monetisable_txns: number;
  conversion: number;
}

export interface CompetitorSummary {
  total_clinics_in_radius: number;
  avg_rating: number;
  top_competitors: Competitor[];
}

import searchTrends from "@/data/metrics/search_trends.json";
import geoIntent from "@/data/metrics/geo_intent.json";

const SYSTEM_PROMPT = `You are the Ray AI Lead Demand Generation Analyst.
You will be provided with four market signals datasets in XML tags: <search_trends>, <geo_intent>, <competitor_density>, and <doctor_signal>.

Your goal is to analyze these signals and generate highly optimized playbooks across our 5 marketing platforms:
1. **Practo listing optimizer**: How to optimize photos, FAQ, services, and auto-bids.
2. **Google Business Profile**: Auto posts and review replies recommendations.
3. **Meta & Google Ads**: A/B creatives and geo-fenced bid strategies.
4. **Doctor video shorts**: Video topics to auto-clip from consults.
5. **WhatsApp broadcast**: Segmentation guidelines by past conditions.

You must return ONLY valid JSON (no markdown, no code fences) matching this exact schema:
{
  "analyzed_signals": {
    "high_intent_keywords": string[],
    "market_opportunity_score": number,
    "competitor_threat_level": "Low" | "Medium" | "High"
  },
  "channels": {
    "practo_listing": { "bookings": number, "pct": number },
    "google_business": { "bookings": number, "pct": number },
    "meta_google_ads": { "bookings": number, "pct": number },
    "video_shorts": { "bookings": number, "pct": number },
    "whatsapp_broadcasts": { "bookings": number, "pct": number }
  },
  "content_published": [
    { "type": string, "title": string, "metric": string, "badge": "video" | "post" | "carousel" }
  ],
  "platforms": {
    "practo_optimization": string,
    "google_business_profile": string,
    "meta_google_ads": string,
    "doctor_video_shorts": string[],
    "whatsapp_broadcast": string
  },
  "growth_report_narrative": string
}

Base your analysis on real data provided. Generate realistic bookings and channel attribution numbers derived from the doctor's monthly case volume and local search demand. The narrative must be 2-3 high-value analytical sentences.`;

export interface ClinicDashboardData {
  clinic: PractoEstablishment;
  doctors: PractoDoctor[];
  competitors: CompetitorSummary;
  searchTrends: typeof searchTrends;
  geoIntent: typeof geoIntent;
  report: DemandGenReport | null;
}

export interface DemandGenReport {
  analyzed_signals: {
    high_intent_keywords: string[];
    market_opportunity_score: number;
    competitor_threat_level: "Low" | "Medium" | "High";
  };
  channels: {
    practo_listing: { bookings: number; pct: number };
    google_business: { bookings: number; pct: number };
    meta_google_ads: { bookings: number; pct: number };
    video_shorts: { bookings: number; pct: number };
    whatsapp_broadcasts: { bookings: number; pct: number };
  };
  content_published: { type: string; title: string; metric: string; badge: string }[];
  platforms: {
    practo_optimization: string;
    google_business_profile: string;
    meta_google_ads: string;
    doctor_video_shorts: string[];
    whatsapp_broadcast: string;
  };
  growth_report_narrative: string;
}

function getFallbackReport(): DemandGenReport {
  return {
    analyzed_signals: {
      high_intent_keywords: ["dental implants cost Bangalore", "root canal treatment Koramangala", "invisalign teeth alignment", "wisdom tooth extraction dentist"],
      market_opportunity_score: 84,
      competitor_threat_level: "Medium",
    },
    channels: {
      practo_listing: { bookings: 22, pct: 47 },
      google_business: { bookings: 14, pct: 30 },
      meta_google_ads: { bookings: 7, pct: 15 },
      video_shorts: { bookings: 3, pct: 6 },
      whatsapp_broadcasts: { bookings: 1, pct: 2 },
    },
    content_published: [
      { type: "Video Short · 32 Sec", title: "\"How CAD/CAM dental crowns are made in 1 day\"", metric: "Auto-clipped · 4.2K views", badge: "video" },
      { type: "Google Post", title: "\"Why laser root canals are virtually pain-free\"", metric: "Auto-written · 78 saves", badge: "post" },
      { type: "Meta Carousel", title: "\"Rahul's Invisalign smile journey at Koramangala\"", metric: "Attributed · CTR +34%", badge: "carousel" },
    ],
    platforms: {
      practo_optimization: "Optimize auto-bids for 'root canal treatment Koramangala' (1,400 monthly searches). Highlight CAD/CAM digital crowns and laser dentistry in listing photos. Add FAQ entries for 'dental implant cost' and 'invisalign duration'. Set consultation fee at ₹100 to undercut competitors averaging ₹70.",
      google_business_profile: "Publish weekly auto-posts highlighting 94 NPS rating and painless laser root canal testimonials. Set up auto-reply templates for review responses mentioning 'Dr. Victor Mag' and 'same-day crown' capabilities.",
      meta_google_ads: "Geo-fence campaigns within 5km of Koramangala 3rd/5th/7th Blocks and HSR Layout Sector 4. Target tech professionals aged 22–45 with creatives focusing on 'Weekend Appointments', 'Cashless Corporate Insurance', and 'Same-Day Crowns'. A/B test video vs. carousel formats.",
      doctor_video_shorts: ["The truth about dental implant pain — what patients actually feel", "How CAD/CAM lets us make crowns in one single day", "Why Invisalign is perfect for Bangalore IT professionals"],
      whatsapp_broadcast: "Segment past patients into: (1) 6-month cleaning due cohort, (2) Invisalign progress check cohort, (3) Crown/implant follow-up cohort. Send personalized reminders with booking links.",
    },
    growth_report_narrative: "Teeth alignment and implant search volume grew 28% MoM in Koramangala, while 50% of competitors lack cashless billing. By geo-fencing Meta ads around HSR Layout tech hubs focusing on weekend slots and cashless insurance, you can capture high-intent corporate patients. Shifting 15% of budget to auto-clipped video shorts on Invisalign and laser dentistry will lower average lead costs by an estimated 15%.",
  };
}

export async function fetchClinicData(clinicId: string): Promise<ClinicDashboardData> {
  let clinic: PractoEstablishment;
  let doctors: PractoDoctor[] = [];
  let competitors: CompetitorSummary = { total_clinics_in_radius: 3, avg_rating: 4.1, top_competitors: [] };

  try {
    clinic = await fetchEstablishment(clinicId);
  } catch (err) {
    console.warn("[DemandGen] Establishment fetch failed:", err);
    clinic = {
      id: clinicId,
      name: "Clinic (API unavailable)",
      address: "Unknown Location",
      city: "Bangalore",
      pincode: "",
      geolocation: "",
      locality: "koramangala",
      doctors: [],
    };
  }

  // Fetch each doctor in parallel
  if (clinic.doctors && clinic.doctors.length > 0) {
    const doctorPromises = clinic.doctors.map(async (doc) => {
      if (doc.id) {
        try {
          return await fetchProvider(doc.id, clinicId);
        } catch (err) {
          console.warn(`[DemandGen] Provider fetch failed for ${doc.id}:`, err);
          return null;
        }
      }
      return null;
    });
    const fetchedDoctors = await Promise.all(doctorPromises);
    doctors = fetchedDoctors.filter((doc): doc is PractoDoctor => doc !== null);
  }

  // Sort doctors by reviews.percentage descending, and then by response_count descending
  doctors.sort((a, b) => {
    if (b.reviews.percentage !== a.reviews.percentage) {
      return b.reviews.percentage - a.reviews.percentage;
    }
    return b.reviews.response_count - a.reviews.response_count;
  });

  // Get competitors from live Practo Search API using geolocation if available
  let searchDocs: any[] = [];
  const hasToken = !!config.practo.bearerToken;
  const geolocation = clinic.geolocation || "27.58517661216576,91.85680680418842";
  const city = clinic.city || "bangalore";
  
  if (hasToken) {
    try {
      searchDocs = await searchDoctors("Dentist", geolocation, city);
    } catch (err) {
      console.warn("[DemandGen] Live searchDoctors failed, trying fallback:", err);
    }
  }

  if (searchDocs && searchDocs.length > 0) {
    const scores = searchDocs.map(d => d.patient_experience_score).filter(Boolean);
    const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 95;
    const avgRating = Math.round((avgScore / 20) * 10) / 10;
    
    const top3 = searchDocs.slice(0, 3).map((item, idx) => {
      const rawFee = item.consultation_fee || "";
      const cleanedFee = typeof rawFee === "string" ? rawFee.replace(/INR\s*/i, "").trim() : String(rawFee);
      const conversionPct = item.patient_experience_score || 93;
      
      return {
        rank: idx + 1,
        practice_name: item.practice_name || "Unknown Practice",
        doctor_name: item.doctor_name || "Unknown Doctor",
        locality: item.practice_address || "Local",
        speciality: item.speciality || "Dentist",
        experience: item.experience || "10 years",
        review_count: item.review_count || 0,
        monetisable_txns: item.review_count || 50,
        conversion: conversionPct,
      };
    });

    competitors = {
      total_clinics_in_radius: searchDocs.length,
      avg_rating: avgRating || 4.1,
      top_competitors: top3,
    };
  } else {
    // Robust mock fallback to top Bangalore dental competitors matching live search structure
    const fallbackCompetitors: Competitor[] = [
      {
        rank: 1,
        practice_name: "Dental De Care",
        doctor_name: "Dr. K A Mohan",
        locality: "domlur",
        speciality: "Orthodontist",
        experience: "57 years",
        review_count: 76,
        monetisable_txns: 76,
        conversion: 93,
      },
      {
        rank: 2,
        practice_name: "Vignesh Dental Speciality Centre",
        doctor_name: "Dr. D N Naveen",
        locality: "new thippasandra",
        speciality: "Endodontist",
        experience: "32 years",
        review_count: 103,
        monetisable_txns: 103,
        conversion: 98,
      },
      {
        rank: 3,
        practice_name: "V-Care Dental Speciality Clinic",
        doctor_name: "Dr. Sanjay Kaul",
        locality: "koramangala",
        speciality: "Periodontist",
        experience: "30 years",
        review_count: 576,
        monetisable_txns: 576,
        conversion: 93,
      }
    ];

    competitors = {
      total_clinics_in_radius: 580,
      avg_rating: 4.7,
      top_competitors: fallbackCompetitors,
    };
  }

  // Try running Claude analysis
  let report: DemandGenReport | null = null;
  const token = config.anthropic.oauthToken;
  if (token) {
    try {
      const doctorSignal = doctors.length > 0 ? {
        lead_doctor_name: doctors[0].name,
        doctor_specialty: doctors[0].speciality,
        clinic_location: `${clinic.locality}, ${clinic.city}`,
        nps_score: doctors[0].reviews.percentage,
        completed_dental_cases_monthly: doctors[0].reviews.response_count,
        average_rating_star: doctors[0].reviews.percentage > 80 ? 4.8 : 4.2,
      } : null;

      const userMessage = `<search_trends>${JSON.stringify(searchTrends)}</search_trends>
<geo_intent>${JSON.stringify(geoIntent)}</geo_intent>
<competitor_density>${JSON.stringify(competitors)}</competitor_density>
<doctor_signal>${JSON.stringify(doctorSignal)}</doctor_signal>`;

      const rawResponse = await callClaude(SYSTEM_PROMPT, userMessage);
      const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      report = JSON.parse(cleaned) as DemandGenReport;
    } catch (error) {
      console.warn("[DemandGen] Claude API call failed, using fallback:", (error as Error).message);
      report = getFallbackReport();
    }
  } else {
    report = getFallbackReport();
  }

  return {
    clinic,
    doctors,
    competitors,
    searchTrends,
    geoIntent,
    report,
  };
}

// Keep backward compat
export async function runDemandGenAnalysis(): Promise<DemandGenReport> {
  const token = config.anthropic.oauthToken;
  if (!token) return getFallbackReport();
  try {
    const userMessage = `<search_trends>${JSON.stringify(searchTrends)}</search_trends>
<geo_intent>${JSON.stringify(geoIntent)}</geo_intent>`;
    const rawResponse = await callClaude(SYSTEM_PROMPT, userMessage);
    const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as DemandGenReport;
  } catch {
    return getFallbackReport();
  }
}
