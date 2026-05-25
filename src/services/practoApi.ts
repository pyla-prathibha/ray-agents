import { config } from "@/config";

const headers = () => ({
  "Authorization": `Bearer ${config.practo.bearerToken}`,
  "Content-Type": "application/json",
});

export interface PractoEstablishment {
  id: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  geolocation: string;
  locality: string;
  doctors: { id: string; name: string }[];
}

export interface PractoDoctor {
  id: string;
  name: string;
  photo: string;
  speciality: string;
  experience: string;
  qualifications: string[];
  consultation_fee: string;
  services_offered: string[];
  bio: string;
  reviews: {
    recommendation: number;
    response_count: number;
    percentage: number;
  };
}

export async function fetchEstablishment(clinicId: string): Promise<PractoEstablishment> {
  const url = `${config.practo.baseUrl}/establishments/${clinicId}`;
  console.log(`[PractoAPI] fetchEstablishment START clinicId=${clinicId} url=${url}`);
  const startTime = Date.now();
  const res = await fetch(url, {
    headers: headers(),
    cache: "no-store",
  });
  const elapsed = Date.now() - startTime;
  console.log(`[PractoAPI] fetchEstablishment RESPONSE clinicId=${clinicId} status=${res.status} elapsed=${elapsed}ms`);
  if (!res.ok) throw new Error(`Establishment API failed: ${res.status} (took ${elapsed}ms)`);
  const data = await res.json();
  console.log(`[PractoAPI] fetchEstablishment PARSED clinicId=${clinicId} doctorCount=${(data.data || data)?.doctors?.length ?? 0}`);
  
  // Extract from response shape
  const est = data.data || data;
  return {
    id: clinicId,
    name: est.name || est.practice_name || "Unknown Clinic",
    address: est.address || est.practice_address || "",
    city: est.city || est.practice_city || "",
    pincode: est.pincode || est.practice_pincode || "",
    geolocation: est.geolocation || "",
    locality: est.locality || "",
    doctors: (est.doctors || est.providers || []).map((d: Record<string, unknown>) => ({
      id: d.id || d.doctor_id || d.provider_id || "",
      name: d.name || d.doctor_name || "",
    })),
  };
}

export async function fetchProvider(providerId: string, clinicId?: string): Promise<PractoDoctor> {
  const url = `${config.practo.baseUrl}/providers/${providerId}`;
  console.log(`[PractoAPI] fetchProvider START providerId=${providerId} clinicId=${clinicId} url=${url}`);
  const startTime = Date.now();
  const res = await fetch(url, {
    headers: headers(),
    cache: "no-store",
  });
  const elapsed = Date.now() - startTime;
  console.log(`[PractoAPI] fetchProvider RESPONSE providerId=${providerId} status=${res.status} elapsed=${elapsed}ms`);
  if (!res.ok) throw new Error(`Provider API failed: ${res.status} (took ${elapsed}ms)`);
  const data = await res.json();
  console.log(`[PractoAPI] fetchProvider PARSED providerId=${providerId} name=${(data.data || data)?.name ?? 'unknown'}`);
  
  const doc = data.data || data;
  const reviews = doc.reviews || doc.review || {};
  
  // Find practice matching clinicId, or fall back to the first practice
  const activePractice = clinicId && doc.practices
    ? doc.practices.find((p: any) => p.id === clinicId || p.practice_id === clinicId)
    : doc.practices?.[0];
    
  const rawFee = activePractice?.doctor_consultation_fee || doc.doctor_consultation_fee || doc.consultation_fee || doc.fee || "";
  const cleanedFee = typeof rawFee === "string" ? rawFee.replace(/INR\s*/i, "").trim() : String(rawFee || "");

  return {
    id: providerId,
    name: doc.name || doc.doctor_name || "Unknown Doctor",
    photo: doc.photo || doc.profile_photo || doc.image_url || "",
    speciality: doc.speciality || doc.specialty || doc.specialization || "",
    experience: doc.experience || doc.years_experience || "",
    qualifications: doc.qualifications || doc.education || [],
    consultation_fee: cleanedFee,
    services_offered: doc.services_offered || doc.services || [],
    bio: doc.bio || doc.about || "",
    reviews: {
      recommendation: reviews.recommendation || reviews.recommendation_count || 0,
      response_count: reviews.response_count || reviews.count || 0,
      percentage: reviews.percentage || reviews.approval_rate || 0,
    },
  };
}

export interface PractoSearchDoctor {
  rank: number;
  doctor_id: string;
  practice_id: string;
  doctor_name: string;
  practice_name: string;
  speciality: string;
  practice_address: string;
  practice_city: string;
  geolocation: string;
  experience: string;
  consultation_fee: string;
  patient_experience_score: number;
  review_count: number;
}

export async function searchDoctors(query: string, geolocation: string, city: string = "bangalore"): Promise<PractoSearchDoctor[]> {
  try {
    const encodedGeo = encodeURIComponent(geolocation.trim());
    const encodedCity = encodeURIComponent(city.trim().toLowerCase());
    const res = await fetch(`${config.practo.baseUrl}/search/doctors?query=${encodeURIComponent(query)}&geolocation=${encodedGeo}&page=1&results_per_page=10&city=${encodedCity}`, {
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Search API failed: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("[practoApi] searchDoctors failed:", err);
    return [];
  }
}

