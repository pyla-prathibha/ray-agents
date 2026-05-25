import { callClaude } from "./claude";
import { config } from "@/config";
import { fetchEstablishment, fetchProvider, searchDoctors, type PractoEstablishment, type PractoDoctor } from "./practoApi";
import fs from "fs";
import path from "path";

export interface Competitor {
  rank: number;
  practice_name: string;
  doctor_name: string;
  locality: string;
  speciality: string;
  experience: string;
  review_count: number;
  monetisable_txns: number;
  specialty_txns?: number;
  is_heuristic?: boolean;
  conversion: number;
}

export interface CompetitorSummary {
  total_clinics_in_radius: number;
  avg_rating: number;
  top_competitors: Competitor[];
  our_clinic_rank?: number;
  our_clinic_txns?: number;
}

import searchTrends from "@/data/metrics/search_trends.json";
import geoIntent from "@/data/metrics/geo_intent.json";

interface CSVRow {
  practice_id: string;
  practice_name: string;
  zone: string;
  speciality: string;
  monetisable_txns: number;
  establishment_uuid?: string; // Placeholder for future string UUID
}

function parseCSV(filePath: string): CSVRow[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[CSV Parser] File not found: ${filePath}`);
      return [];
    }
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Parse header to find index mapping
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const idIdx = headers.indexOf("practice_id");
    const nameIdx = headers.indexOf("practice_name");
    const zoneIdx = headers.indexOf("zone");
    const specIdx = headers.indexOf("speciality");
    const txnsIdx = headers.indexOf("monetisable_txns");
    
    // Check if there is a placeholder uuid column
    const uuidIdx = headers.findIndex(h => h.includes("uuid") || h.includes("reference") || h.includes("establishment_id"));

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Basic CSV splitter to support simple formats
      let parts: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      parts.push(current.trim());
      
      if (parts.length < 5) continue;
      
      rows.push({
        practice_id: parts[idIdx] || "",
        practice_name: parts[nameIdx] || "",
        zone: parts[zoneIdx] || "",
        speciality: parts[specIdx] || "",
        monetisable_txns: parseInt(parts[txnsIdx] || "0", 10) || 0,
        establishment_uuid: uuidIdx !== -1 ? parts[uuidIdx] : undefined
      });
    }
    return rows;
  } catch (err) {
    console.error("[CSV Parser] Error parsing sales_transactions.csv:", err);
    return [];
  }
}

function findClinic(clinicId: string, clinicName: string, locality: string, rows: CSVRow[]): CSVRow | null {
  // 1. Try exact match on UUID (placeholder for data analytics team)
  const uuidMatch = rows.find(r => r.establishment_uuid === clinicId);
  if (uuidMatch) return uuidMatch;
  
  // 2. Try match on numeric ID (if client passes practice_id as parameter)
  const idMatch = rows.find(r => r.practice_id.trim() === clinicId.trim());
  if (idMatch) return idMatch;

  return null;
}

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
    "high_intent_keywords": string[]
  },
  "channels": {
    "practo_listing": { "bookings": number, "pct": number },
    "google_business": { "bookings": number, "pct": number },
    "meta_google_ads": { "bookings": number, "pct": number },
    "video_shorts": { "bookings": number, "pct": number },
    "whatsapp_broadcasts": { "bookings": number, "pct": number }
  },
  "content_published": [
    // You MUST always generate exactly 5 items in this array (no more, no less)
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

Base your analysis on real data provided. Generate realistic bookings and channel attribution numbers derived from the doctor's monthly case volume and local search demand. The narrative must be 2-3 high-value analytical sentences. You MUST always generate exactly 5 auto-published content pieces under "content_published".

STRICT CONTENT RULES (apply to every string field — narrative, platforms.*, content_published.*):
1. NEVER name any competing clinic, practice, hospital, or competitor doctor — even if their name appears in <competitor_density>. Refer to them only by generic descriptors ("the market leader", "top-3 competitors", "rank-1 clinic", "nearby competitors").
2. NEVER include specific dates, day names, months, years, ISO timestamps, or fixed timeframes ("within 60 days", "by Q3", "in March", "next Thursday", "60-day", "90 days"). Speak only in continuous tense and relative cadence words ("near-term", "on a rolling basis", "ongoing", "monthly"). Month-over-month percentage metrics ("MoM", "+28% MoM") are allowed because they are units, not dates.
3. Names of the clinic being analyzed, its own doctors, localities, specialties, and keyword clusters ARE allowed.`;

export interface ClinicDashboardData {
  clinic: PractoEstablishment;
  doctors: PractoDoctor[];
  competitors: CompetitorSummary;
  searchTrends: typeof searchTrends;
  geoIntent: typeof geoIntent;
  report: DemandGenReport | null;
  our_monetisable_txns?: number;
}

export interface DemandGenReport {
  analyzed_signals: {
    high_intent_keywords: string[];
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
    },
    channels: {
      practo_listing: { bookings: 22, pct: 47 },
      google_business: { bookings: 14, pct: 30 },
      meta_google_ads: { bookings: 7, pct: 15 },
      video_shorts: { bookings: 3, pct: 6 },
      whatsapp_broadcasts: { bookings: 1, pct: 2 },
    },
    content_published: [
      { type: "Video Short · 32 Sec", title: "\"How CAD/CAM dental crowns are made in a single visit\"", metric: "Auto-clipped · 4.2K views", badge: "video" },
      { type: "Google Post", title: "\"Why laser root canals are virtually pain-free\"", metric: "Auto-written · 78 saves", badge: "post" },
      { type: "Meta Carousel", title: "\"Rahul's Invisalign smile journey at Koramangala\"", metric: "Attributed · CTR +34%", badge: "carousel" },
      { type: "Video Short · 45 Sec", title: "\"The truth about dental implant pain — patient review\"", metric: "Auto-clipped · 8.9K views", badge: "video" },
      { type: "Google Post", title: "\"Understanding Invisalign vs traditional metal braces\"", metric: "Auto-written · 142 saves", badge: "post" },
    ],
    platforms: {
      practo_optimization: "Optimize auto-bids for 'root canal treatment Koramangala' (1,400 monthly searches). Highlight CAD/CAM digital crowns and laser dentistry in listing photos. Add FAQ entries for 'dental implant cost' and 'invisalign duration'. Set consultation fee at ₹100 to undercut nearby competitors averaging ₹70.",
      google_business_profile: "Publish weekly auto-posts highlighting 94 NPS rating and painless laser root canal testimonials. Set up auto-reply templates for review responses mentioning 'Dr. Victor Mag' and 'same-day crown' capabilities.",
      meta_google_ads: "Geo-fence campaigns within 5km of Koramangala 3rd/5th/7th Blocks and HSR Layout Sector 4. Target tech professionals aged 22–45 with creatives focusing on 'Weekend Appointments', 'Cashless Corporate Insurance', and 'Same-Day Crowns'. A/B test video vs. carousel formats.",
      doctor_video_shorts: ["The truth about dental implant pain — what patients actually feel", "How CAD/CAM lets us make crowns in a single visit", "Why Invisalign is perfect for Bangalore IT professionals"],
      whatsapp_broadcast: "Segment past patients into: (1) routine cleaning due cohort, (2) Invisalign progress check cohort, (3) Crown/implant follow-up cohort. Send personalized reminders with booking links.",
    },
    growth_report_narrative: "Teeth alignment and implant search volume grew 28% MoM in Koramangala, while 50% of nearby competitors lack cashless billing. By geo-fencing Meta ads around HSR Layout tech hubs focusing on weekend slots and cashless insurance, you can capture high-intent corporate patients. Shifting 15% of budget to auto-clipped video shorts on Invisalign and laser dentistry will lower average lead costs by an estimated 15%.",
  };
}

export async function fetchClinicData(clinicId: string): Promise<ClinicDashboardData> {
  console.log(`[DemandGen] fetchClinicData START clinicId=${clinicId}`);
  const overallStart = Date.now();
  let clinic: PractoEstablishment;
  let doctors: PractoDoctor[] = [];
  let competitors: CompetitorSummary = { total_clinics_in_radius: 3, avg_rating: 4.7, top_competitors: [] };
  let our_monetisable_txns = 0;

  try {
    const estStart = Date.now();
    clinic = await fetchEstablishment(clinicId);
    console.log(`[DemandGen] Establishment fetched in ${Date.now() - estStart}ms, doctors=${clinic.doctors?.length ?? 0}`);
  } catch (err) {
    console.warn("[DemandGen] Establishment fetch failed:", err);
    clinic = {
      id: clinicId,
      name: "Clinic (API unavailable)",
      address: "Unknown Location",
      city: "Bangalore",
      pincode: "",
      geolocation: "",
      locality: "hsr layout",
      doctors: [],
    };
  }

  // Fetch each doctor in parallel
  if (clinic.doctors && clinic.doctors.length > 0) {
    console.log(`[DemandGen] Fetching ${clinic.doctors.length} providers in parallel for clinicId=${clinicId}`);
    const providersStart = Date.now();
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
    console.log(`[DemandGen] All providers fetched in ${Date.now() - providersStart}ms, resolved=${doctors.length}/${clinic.doctors.length}`);
  }

  // Sort doctors by reviews.percentage descending, and then by response_count descending
  doctors.sort((a, b) => {
    if (b.reviews.percentage !== a.reviews.percentage) {
      return b.reviews.percentage - a.reviews.percentage;
    }
    return b.reviews.response_count - a.reviews.response_count;
  });

  // CSV-based Sales Transactions Competitor and Clinic Transaction Lookup
  let csvResolved = false;
  try {
    const localCsvPath = path.join(process.cwd(), "src/data/sales_transactions.csv");
    const localSpecialtyCsvPath = path.join(process.cwd(), "src/data/sales_transactions_by_speciality.csv");

    // 1. Load Specialty Lookup Map for Exact Per-Specialty Transactions
    const specialtyLookupMap = new Map<string, number>();
    if (fs.existsSync(localSpecialtyCsvPath)) {
      const specRows = parseCSV(localSpecialtyCsvPath);
      specRows.forEach(row => {
        // Key format: practiceId_specialty
        const key = `${row.practice_id.trim()}_${row.speciality.trim().toLowerCase()}`;
        specialtyLookupMap.set(key, row.monetisable_txns);
      });
      console.log(`[DemandGen] Parsed specialty breakout map with ${specialtyLookupMap.size} entries.`);
    }

    if (fs.existsSync(localCsvPath)) {
      const csvRows = parseCSV(localCsvPath);
      
      if (csvRows.length > 0) {
        const matched = findClinic(clinicId, clinic.name, clinic.locality || "hsr layout", csvRows);
        
        if (matched) {
          if (matched.zone) {
            clinic.locality = matched.zone.trim().charAt(0).toUpperCase() + matched.zone.trim().slice(1).toLowerCase();
          }
          const targetZone = (matched.zone || clinic.locality || "hsr layout").trim().toLowerCase();
          const targetSpec = "General Dentistry";

          // Helper function to resolve per-specialty transactions (exact or heuristic fallback)
          const getSpecialtyTxns = (practiceId: string, totalTxns: number, specialtyListStr: string, specName: string) => {
            const specKey = `${practiceId.trim()}_${specName.trim().toLowerCase()}`;
            if (specialtyLookupMap.has(specKey)) {
              return { txns: specialtyLookupMap.get(specKey) || 0, isHeuristic: false };
            }
            // Heuristic Fallback
            const specs = specialtyListStr.split(";").map(s => s.trim()).filter(Boolean);
            const divisor = specs.length || 1;
            return { txns: Math.round(totalTxns / divisor), isHeuristic: true };
          };

          // Resolve our clinic's specific dental transactions
          const ourResolved = getSpecialtyTxns(matched.practice_id, matched.monetisable_txns, matched.speciality, targetSpec);
          our_monetisable_txns = ourResolved.txns;

          // Calculate our clinic's rank in the entire zone list
          const allZonePractices = csvRows.filter(r => {
            if (r.zone.trim().toLowerCase() !== targetZone) return false;
            const specialties = r.speciality.split(";").map(s => s.trim().toLowerCase());
            return specialties.includes(targetSpec.toLowerCase());
          });

          if (!allZonePractices.some(r => r.practice_id === matched.practice_id)) {
            allZonePractices.push(matched);
          }

          const practicesWithTxns = allZonePractices.map(r => {
            const resolved = getSpecialtyTxns(r.practice_id, r.monetisable_txns, r.speciality, targetSpec);
            return {
              practice_id: r.practice_id,
              txns: resolved.txns,
              overall: r.monetisable_txns
            };
          });

          practicesWithTxns.sort((a, b) => {
            if (b.txns !== a.txns) return b.txns - a.txns;
            return b.overall - a.overall;
          });

          const ourRank = practicesWithTxns.findIndex(p => p.practice_id === matched.practice_id) + 1;

          // Find competitors in same zone with speciality 'General Dentistry' (or contains it) excluding our own practice_id
          const dentalCompetitors = csvRows.filter(r => {
            if (r.zone.trim().toLowerCase() !== targetZone) return false;
            if (r.practice_id.trim() === matched.practice_id.trim()) return false;
            
            const specialties = r.speciality.split(";").map(s => s.trim().toLowerCase());
            return specialties.includes(targetSpec.toLowerCase());
          });

          // Sort competitors by specialty transactions descending (tie breaker by overall volume)
          dentalCompetitors.sort((a, b) => {
            const txnsA = getSpecialtyTxns(a.practice_id, a.monetisable_txns, a.speciality, targetSpec).txns;
            const txnsB = getSpecialtyTxns(b.practice_id, b.monetisable_txns, b.speciality, targetSpec).txns;
            if (txnsB !== txnsA) return txnsB - txnsA;
            return b.monetisable_txns - a.monetisable_txns;
          });
          
          const top3 = dentalCompetitors.slice(0, 3).map((item) => {
            const resolved = getSpecialtyTxns(item.practice_id, item.monetisable_txns, item.speciality, targetSpec);
            const compRank = practicesWithTxns.findIndex(p => p.practice_id === item.practice_id) + 1;
            const parsedId = parseInt(item.practice_id.replace(/[^0-9]/g, ""), 10) || 12345;
            const expYears = 10 + (parsedId % 16); // stable value between 10 and 25 years
            const experienceStr = `${expYears} years`;
            return {
              rank: compRank || 2,
              practice_name: item.practice_name || "Unknown Practice",
              doctor_name: "Lead Practitioner",
              locality: item.zone || targetZone,
              speciality: item.speciality || "General Dentistry",
              experience: experienceStr,
              review_count: item.monetisable_txns, // Overall for backward compat
              monetisable_txns: item.monetisable_txns, // Overall
              specialty_txns: resolved.txns, // Specialty specific
              is_heuristic: resolved.isHeuristic, // Heuristic flag
              conversion: 95,
            };
          });

          competitors = {
            total_clinics_in_radius: allZonePractices.length, 
            avg_rating: 4.8,
            top_competitors: top3,
            our_clinic_rank: ourRank,
            our_clinic_txns: our_monetisable_txns,
          };
          csvResolved = true;
        }
      }
    }
  } catch (err) {
    console.error("[DemandGen] CSV-based competitor lookup failed, falling back:", err);
  }

  // Live Search Doctors API (Kept commented out as fallback)
  /*
  if (!csvResolved) {
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
        const cleanedFee = typeof rawFee === "string" ? rawFee.replace(new RegExp("INR\\s*", "i"), "").trim() : String(rawFee);
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
      csvResolved = true;
    }
  }
  */

  // Hardcoded Robust Fallback (only used if CSV and API both fail)
  if (!csvResolved) {
    const fallbackCompetitors: Competitor[] = [
      {
        rank: 1,
        practice_name: "Dental De Care",
        doctor_name: "Dr. K A Mohan",
        locality: "domlur",
        speciality: "General Dentistry",
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
        speciality: "General Dentistry",
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
        speciality: "General Dentistry",
        experience: "30 years",
        review_count: 576,
        monetisable_txns: 576,
        conversion: 93,
      }
    ];

    competitors = {
      total_clinics_in_radius: 4,
      avg_rating: 4.7,
      top_competitors: fallbackCompetitors,
      our_clinic_rank: 4,
      our_clinic_txns: 65,
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

  console.log(`[DemandGen] fetchClinicData DONE clinicId=${clinicId} totalElapsed=${Date.now() - overallStart}ms doctors=${doctors.length} csvResolved=${csvResolved}`);
  return {
    clinic,
    doctors,
    competitors,
    searchTrends,
    geoIntent,
    report,
    our_monetisable_txns,
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
