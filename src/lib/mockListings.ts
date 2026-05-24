/**
 * Mock listing data for demo + SEO seeding.
 * Replaced by Supabase `listings` table queries in Phase 1.
 *
 * Keep this file as a plain `.ts` (no "use client") so both server and
 * client components can safely import — see Mistakes Log entry #2.
 *
 * Coverage (20 listings):
 *  - Kochi 6 / Bangalore 4 / Chennai 3 / Trivandrum 3 / Calicut 2 / Trichur 2
 *  - Types: PG (9) / Hostel (5) / Flat (6)
 *  - Genders: any (4) / women (5) / men (4) / couple (3) / family (4)
 *  - Wedges: ≥3 couple / ≥7 bachelor / ≥3 pet / ≥8 student
 *  - Verified: 16 / pending: 4
 *  - AC mix: ~50/50, food mix: ~60/40
 */
import type { Listing, RoomType, WedgeTag } from "./types";
import { slugify } from "./utils";

/** Small deterministic helper so we can reuse the same room-type ids without typing UUIDs. */
function makeRoomTypes(
  listingId: string,
  rows: Array<Omit<RoomType, "id" | "listing_id">>,
): RoomType[] {
  return rows.map((r, i) => ({
    ...r,
    id: `${listingId}_rt${i + 1}`,
    listing_id: listingId,
  }));
}

const NOW = "2026-05-20T00:00:00Z";

/* ============================================================
   KOCHI (6)
   ============================================================ */

const L1: Listing = {
  id: "l_koc_01",
  owner_id: "own_kerala_01",
  type: "pg",
  title: "Sunshine PG",
  slug: slugify("Sunshine PG Edappally"),
  description:
    "Modern PG just 8 minutes from Lulu Mall and Edappally Junction. Single and double rooms with AC, attached bathrooms, and home-cooked Kerala meals included. Walking distance to Edappally metro.",
  city: "kochi",
  area: "Edappally",
  landmark: "Lulu Mall",
  approx_lat: 10.025,
  approx_lng: 76.308,
  gender_pref: "women",
  wedge_tags: ["women", "student"],
  amenities: ["wifi", "food", "laundry", "ac", "hot_water", "security", "housekeeping"],
  house_rules: ["No smoking", "Entry by 10:30 PM", "Guests only in common area"],
  status: "live",
  is_verified: true,
  total_beds: 24,
  total_vacancies: 4,
  created_at: "2025-09-15T00:00:00Z",
  updated_at: NOW,
};
L1.room_types = makeRoomTypes(L1.id, [
  { name: "Single AC", price_per_month: 9500, ac: true, attached_bathroom: true, occupancy: 1, vacancies: 1 },
  { name: "Double Sharing AC", price_per_month: 6500, ac: true, attached_bathroom: true, occupancy: 2, vacancies: 2 },
  { name: "Triple Sharing", price_per_month: 4800, ac: false, attached_bathroom: false, occupancy: 3, vacancies: 1 },
]);

const L2: Listing = {
  id: "l_koc_02",
  owner_id: "own_kerala_02",
  type: "pg",
  title: "Techie Nest PG",
  slug: slugify("Techie Nest PG Kakkanad"),
  description:
    "Bachelor-friendly PG built for Infopark techies. 5-minute walk to Infopark Phase 1, 24/7 power backup, high-speed Wi-Fi, gym access, and a dedicated study room. AC and non-AC options.",
  city: "kochi",
  area: "Kakkanad",
  landmark: "Infopark Phase 1",
  approx_lat: 10.014,
  approx_lng: 76.355,
  gender_pref: "men",
  wedge_tags: ["bachelor", "men", "student"],
  amenities: ["wifi", "food", "gym", "ac", "power_backup", "parking", "study_room"],
  house_rules: ["No smoking indoors", "Quiet hours after 11 PM", "Visitors limited to lobby"],
  status: "live",
  is_verified: true,
  total_beds: 30,
  total_vacancies: 6,
  created_at: "2025-08-12T00:00:00Z",
  updated_at: NOW,
};
L2.room_types = makeRoomTypes(L2.id, [
  { name: "Single AC", price_per_month: 11000, ac: true, attached_bathroom: true, occupancy: 1, vacancies: 2 },
  { name: "Double Sharing AC", price_per_month: 7800, ac: true, attached_bathroom: true, occupancy: 2, vacancies: 4 },
]);

const L3: Listing = {
  id: "l_koc_03",
  owner_id: "own_kerala_03",
  type: "flat",
  title: "Casa Cozy Couple Studio",
  slug: slugify("Casa Cozy Couple Studio Kaloor"),
  description:
    "Cozy 1BHK studio in central Kaloor — explicitly couple-friendly. Fully furnished, modular kitchen, washing machine, dedicated parking. Society pre-approved for unmarried couples on long-stay leases.",
  city: "kochi",
  area: "Kaloor",
  landmark: "Kaloor Stadium",
  approx_lat: 9.985,
  approx_lng: 76.298,
  gender_pref: "couple",
  wedge_tags: ["couple"],
  amenities: ["wifi", "ac", "laundry", "parking", "balcony", "hot_water"],
  house_rules: ["Long-stay only (3 month minimum)", "No loud parties", "No additional guests overnight"],
  status: "live",
  is_verified: true,
  total_beds: 1,
  total_vacancies: 1,
  created_at: "2025-10-22T00:00:00Z",
  updated_at: NOW,
};
L3.room_types = makeRoomTypes(L3.id, [
  { name: "Couple Studio", price_per_month: 18500, ac: true, attached_bathroom: true, occupancy: 2, vacancies: 1 },
]);

const L4: Listing = {
  id: "l_koc_04",
  owner_id: "own_kerala_01",
  type: "hostel",
  title: "Greenview Boys Hostel",
  slug: slugify("Greenview Boys Hostel Vyttila"),
  description:
    "Affordable boys hostel near Vyttila Mobility Hub. Triple and quad sharing rooms, three home-cooked meals daily, sports room, and 24/7 security. Walking distance to Vyttila metro and bus stand.",
  city: "kochi",
  area: "Vyttila",
  landmark: "Vyttila Mobility Hub",
  approx_lat: 9.967,
  approx_lng: 76.318,
  gender_pref: "men",
  wedge_tags: ["men", "bachelor", "student"],
  amenities: ["wifi", "food", "laundry", "security", "common_kitchen", "study_room"],
  house_rules: ["No alcohol on premises", "Entry by 11 PM", "No outside food in rooms"],
  status: "live",
  is_verified: true,
  total_beds: 40,
  total_vacancies: 12,
  created_at: "2025-11-08T00:00:00Z",
  updated_at: NOW,
};
L4.room_types = makeRoomTypes(L4.id, [
  { name: "Triple Sharing", price_per_month: 4500, ac: false, attached_bathroom: false, occupancy: 3, vacancies: 6 },
  { name: "Quad Sharing", price_per_month: 3800, ac: false, attached_bathroom: false, occupancy: 4, vacancies: 6 },
]);

const L5: Listing = {
  id: "l_koc_05",
  owner_id: "own_kerala_02",
  type: "flat",
  title: "Pawfect Stay Aluva",
  slug: slugify("Pawfect Stay Aluva"),
  description:
    "Pet-friendly 2BHK flat in Aluva — bring your dog or cat without negotiation. Tiled flooring, balcony with grill, ground-floor for easy pet walks, and society pre-approved for pets up to medium-sized dogs.",
  city: "kochi",
  area: "Aluva",
  landmark: "Aluva Metro Station",
  approx_lat: 10.106,
  approx_lng: 76.353,
  gender_pref: "family",
  wedge_tags: ["pet", "family"],
  amenities: ["wifi", "ac", "parking", "balcony", "hot_water", "housekeeping"],
  house_rules: ["Pets allowed (dogs / cats / small pets)", "No exotic animals", "Refundable pet deposit Rs 5,000"],
  status: "live",
  is_verified: true,
  total_beds: 2,
  total_vacancies: 1,
  created_at: "2025-12-01T00:00:00Z",
  updated_at: NOW,
};
L5.room_types = makeRoomTypes(L5.id, [
  { name: "2BHK Whole Flat", price_per_month: 22000, ac: true, attached_bathroom: true, occupancy: 4, vacancies: 1 },
]);

const L6: Listing = {
  id: "l_koc_06",
  owner_id: "own_kerala_03",
  type: "pg",
  title: "Fort Heritage PG",
  slug: slugify("Fort Heritage PG Fort Kochi"),
  description:
    "Charming heritage-style PG in Fort Kochi, perfect for solo travelers, freelancers, and remote workers. Walking distance to beach, cafes, and the Chinese fishing nets. Mixed-gender with strict community rules.",
  city: "kochi",
  area: "Fort Kochi",
  landmark: "Chinese Fishing Nets",
  approx_lat: 9.965,
  approx_lng: 76.245,
  gender_pref: "any",
  wedge_tags: ["bachelor"],
  amenities: ["wifi", "food", "laundry", "hot_water", "common_kitchen", "terrace_access"],
  house_rules: ["No smoking", "Music off after 10 PM", "Common kitchen cleaning roster"],
  status: "pending_review",
  is_verified: false,
  total_beds: 14,
  total_vacancies: 3,
  created_at: "2026-04-09T00:00:00Z",
  updated_at: NOW,
};
L6.room_types = makeRoomTypes(L6.id, [
  { name: "Single Non-AC", price_per_month: 8500, ac: false, attached_bathroom: true, occupancy: 1, vacancies: 1 },
  { name: "Double Sharing", price_per_month: 5800, ac: false, attached_bathroom: false, occupancy: 2, vacancies: 2 },
]);

/* ============================================================
   BANGALORE (4)
   ============================================================ */

const L7: Listing = {
  id: "l_blr_01",
  owner_id: "own_blr_01",
  type: "flat",
  title: "Pawfect Home Marathahalli",
  slug: slugify("Pawfect Home Marathahalli"),
  description:
    "Premium pet-friendly 2BHK in Marathahalli — close to ORR tech corridor and a 10-minute drive to Whitefield. Society allows pets up to 25kg. Comes with refundable pet deposit and washing area.",
  city: "bangalore",
  area: "Marathahalli",
  landmark: "Marathahalli Bridge",
  approx_lat: 12.957,
  approx_lng: 77.701,
  gender_pref: "couple",
  wedge_tags: ["pet", "couple"],
  amenities: ["wifi", "ac", "parking", "balcony", "power_backup", "security"],
  house_rules: ["Pet deposit Rs 10,000 refundable", "No exotic pets", "Society quiet hours after 10 PM"],
  status: "live",
  is_verified: true,
  total_beds: 2,
  total_vacancies: 1,
  created_at: "2025-11-15T00:00:00Z",
  updated_at: NOW,
};
L7.room_types = makeRoomTypes(L7.id, [
  { name: "2BHK Whole Flat", price_per_month: 28000, ac: true, attached_bathroom: true, occupancy: 4, vacancies: 1 },
]);

const L8: Listing = {
  id: "l_blr_02",
  owner_id: "own_blr_01",
  type: "pg",
  title: "Skyline PG",
  slug: slugify("Skyline PG HSR Layout"),
  description:
    "Women-only PG in HSR Layout's tech belt. AC rooms, three meals daily, doctor on call, and biometric entry. Walking distance to several startups and 15 minutes to Koramangala.",
  city: "bangalore",
  area: "HSR Layout",
  landmark: "27th Main HSR",
  approx_lat: 12.911,
  approx_lng: 77.638,
  gender_pref: "women",
  wedge_tags: ["women", "student"],
  amenities: ["wifi", "food", "ac", "laundry", "security", "housekeeping", "power_backup"],
  house_rules: ["Biometric entry/exit", "Entry by 10 PM", "No male visitors past lobby"],
  status: "live",
  is_verified: true,
  total_beds: 36,
  total_vacancies: 5,
  created_at: "2025-12-18T00:00:00Z",
  updated_at: NOW,
};
L8.room_types = makeRoomTypes(L8.id, [
  { name: "Single AC", price_per_month: 14500, ac: true, attached_bathroom: true, occupancy: 1, vacancies: 1 },
  { name: "Double Sharing AC", price_per_month: 10800, ac: true, attached_bathroom: true, occupancy: 2, vacancies: 4 },
]);

const L9: Listing = {
  id: "l_blr_03",
  owner_id: "own_blr_02",
  type: "hostel",
  title: "Brindavan Bachelors PG",
  slug: slugify("Brindavan Bachelors PG Koramangala"),
  description:
    "Bachelor-friendly hostel-style PG in 5th Block Koramangala. Walking distance to Forum Mall, ample co-working space, weekly cricket meetups on the terrace, and zero curfew on weekends.",
  city: "bangalore",
  area: "Koramangala",
  landmark: "Forum Mall",
  approx_lat: 12.934,
  approx_lng: 77.624,
  gender_pref: "men",
  wedge_tags: ["bachelor", "men"],
  amenities: ["wifi", "food", "laundry", "gym", "study_room", "terrace_access"],
  house_rules: ["Weekday quiet hours 11pm-6am", "Common kitchen weekend access", "Visitors register at gate"],
  status: "live",
  is_verified: true,
  total_beds: 28,
  total_vacancies: 9,
  created_at: "2026-01-22T00:00:00Z",
  updated_at: NOW,
};
L9.room_types = makeRoomTypes(L9.id, [
  { name: "Single Non-AC", price_per_month: 12000, ac: false, attached_bathroom: true, occupancy: 1, vacancies: 3 },
  { name: "Double Sharing", price_per_month: 8500, ac: false, attached_bathroom: false, occupancy: 2, vacancies: 6 },
]);

const L10: Listing = {
  id: "l_blr_04",
  owner_id: "own_blr_02",
  type: "pg",
  title: "Maple Heights PG",
  slug: slugify("Maple Heights PG Whitefield"),
  description:
    "Premium co-living PG in Whitefield's ITPL belt. Studio-style private rooms, daily housekeeping, weekly linen change, in-house cafe, and free shuttle to ITPL on weekdays.",
  city: "bangalore",
  area: "Whitefield",
  landmark: "ITPL",
  approx_lat: 12.972,
  approx_lng: 77.749,
  gender_pref: "any",
  wedge_tags: ["bachelor"],
  amenities: ["wifi", "food", "ac", "laundry", "gym", "housekeeping", "power_backup", "parking"],
  house_rules: ["Smoking only in designated area", "No loud music after 10pm", "Subletting prohibited"],
  status: "pending_review",
  is_verified: false,
  total_beds: 48,
  total_vacancies: 12,
  created_at: "2026-03-30T00:00:00Z",
  updated_at: NOW,
};
L10.room_types = makeRoomTypes(L10.id, [
  { name: "Studio Single AC", price_per_month: 18500, ac: true, attached_bathroom: true, occupancy: 1, vacancies: 5 },
  { name: "Double Sharing AC", price_per_month: 12500, ac: true, attached_bathroom: true, occupancy: 2, vacancies: 7 },
]);

/* ============================================================
   CHENNAI (3)
   ============================================================ */

const L11: Listing = {
  id: "l_chn_01",
  owner_id: "own_chn_01",
  type: "pg",
  title: "Lakshmi Hostel",
  slug: slugify("Lakshmi Hostel OMR"),
  description:
    "Family-run women's PG on Old Mahabalipuram Road. Vegetarian South Indian meals, daily prayer room access, and warden on-site. 10 minutes to Tidel Park, walking distance to OMR bus stops.",
  city: "chennai",
  area: "OMR",
  landmark: "Tidel Park",
  approx_lat: 12.954,
  approx_lng: 80.241,
  gender_pref: "women",
  wedge_tags: ["women", "student", "family"],
  amenities: ["wifi", "food", "laundry", "hot_water", "security", "housekeeping"],
  house_rules: ["Vegetarian only", "Entry by 9:30 PM", "Saturday warden meeting"],
  status: "live",
  is_verified: true,
  total_beds: 22,
  total_vacancies: 3,
  created_at: "2025-12-15T00:00:00Z",
  updated_at: NOW,
};
L11.room_types = makeRoomTypes(L11.id, [
  { name: "Single Non-AC", price_per_month: 10500, ac: false, attached_bathroom: true, occupancy: 1, vacancies: 1 },
  { name: "Double Sharing AC", price_per_month: 8200, ac: true, attached_bathroom: true, occupancy: 2, vacancies: 2 },
]);

const L12: Listing = {
  id: "l_chn_02",
  owner_id: "own_chn_01",
  type: "hostel",
  title: "RBR Residency Hostel",
  slug: slugify("RBR Residency Hostel Velachery"),
  description:
    "Budget-friendly mixed hostel in Velachery — 2 minutes from MRTS station. Triple and dorm sharing options. Includes Wi-Fi, daily housekeeping, and a common TV room with sports channels.",
  city: "chennai",
  area: "Velachery",
  landmark: "Velachery MRTS",
  approx_lat: 12.978,
  approx_lng: 80.221,
  gender_pref: "any",
  wedge_tags: ["bachelor", "student"],
  amenities: ["wifi", "laundry", "common_kitchen", "security", "hot_water"],
  house_rules: ["Quiet hours 11pm-6am", "No alcohol indoors", "Bunk bedding only"],
  status: "live",
  is_verified: true,
  total_beds: 36,
  total_vacancies: 14,
  created_at: "2026-01-08T00:00:00Z",
  updated_at: NOW,
};
L12.room_types = makeRoomTypes(L12.id, [
  { name: "Triple Sharing", price_per_month: 5500, ac: false, attached_bathroom: false, occupancy: 3, vacancies: 6 },
  { name: "Dorm 6-Sharing", price_per_month: 4200, ac: false, attached_bathroom: false, occupancy: 6, vacancies: 8 },
]);

const L13: Listing = {
  id: "l_chn_03",
  owner_id: "own_chn_02",
  type: "flat",
  title: "Anna Nagar Comfort Stay",
  slug: slugify("Anna Nagar Comfort Stay"),
  description:
    "Family-friendly 2BHK flat in Anna Nagar West, gated society with playground and 24/7 security. Perfect for working couples or small families. Includes scheduled deep-cleaning every fortnight.",
  city: "chennai",
  area: "Anna Nagar",
  landmark: "Anna Nagar Tower",
  approx_lat: 13.085,
  approx_lng: 80.218,
  gender_pref: "family",
  wedge_tags: ["family", "couple"],
  amenities: ["wifi", "ac", "parking", "balcony", "security", "housekeeping", "power_backup"],
  house_rules: ["Long-stay 6 month min", "Society guest register", "No bachelors groups"],
  status: "pending_review",
  is_verified: false,
  total_beds: 2,
  total_vacancies: 1,
  created_at: "2026-04-19T00:00:00Z",
  updated_at: NOW,
};
L13.room_types = makeRoomTypes(L13.id, [
  { name: "2BHK Whole Flat", price_per_month: 26500, ac: true, attached_bathroom: true, occupancy: 4, vacancies: 1 },
]);

/* ============================================================
   TRIVANDRUM (3)
   ============================================================ */

const L14: Listing = {
  id: "l_tvm_01",
  owner_id: "own_kerala_01",
  type: "pg",
  title: "PrimeStay PG",
  slug: slugify("PrimeStay PG Technopark"),
  description:
    "Located right inside Technopark Phase 3 cluster. Working-professional focused — early breakfast, late dinner, weekend brunch. AC rooms with study tables and standing desks. 3-minute walk to office gates.",
  city: "trivandrum",
  area: "Technopark",
  landmark: "Technopark Phase 3",
  approx_lat: 8.557,
  approx_lng: 76.882,
  gender_pref: "any",
  wedge_tags: ["bachelor", "student"],
  amenities: ["wifi", "food", "ac", "laundry", "power_backup", "study_room"],
  house_rules: ["Quiet zone after 11 PM", "Visitors only in lobby", "Power backup till 8 hours"],
  status: "live",
  is_verified: true,
  total_beds: 20,
  total_vacancies: 4,
  created_at: "2025-10-04T00:00:00Z",
  updated_at: NOW,
};
L14.room_types = makeRoomTypes(L14.id, [
  { name: "Single AC", price_per_month: 11500, ac: true, attached_bathroom: true, occupancy: 1, vacancies: 2 },
  { name: "Double Sharing AC", price_per_month: 8200, ac: true, attached_bathroom: true, occupancy: 2, vacancies: 2 },
]);

const L15: Listing = {
  id: "l_tvm_02",
  owner_id: "own_kerala_02",
  type: "hostel",
  title: "Krishna Nivas Hostel",
  slug: slugify("Krishna Nivas Hostel Kazhakuttam"),
  description:
    "Women-only hostel near Kazhakuttam. Authentic Kerala-style meals, dedicated study room, prayer corner, and warden supervision. 10 minutes to Technopark via auto.",
  city: "trivandrum",
  area: "Kazhakuttam",
  landmark: "Kazhakuttam Junction",
  approx_lat: 8.575,
  approx_lng: 76.875,
  gender_pref: "women",
  wedge_tags: ["women", "student"],
  amenities: ["wifi", "food", "laundry", "hot_water", "security", "housekeeping", "study_room"],
  house_rules: ["Vegetarian only", "Entry by 9 PM", "Family visitor approval required"],
  status: "live",
  is_verified: true,
  total_beds: 30,
  total_vacancies: 6,
  created_at: "2025-11-19T00:00:00Z",
  updated_at: NOW,
};
L15.room_types = makeRoomTypes(L15.id, [
  { name: "Triple Sharing", price_per_month: 4900, ac: false, attached_bathroom: false, occupancy: 3, vacancies: 3 },
  { name: "Double Sharing", price_per_month: 6500, ac: false, attached_bathroom: true, occupancy: 2, vacancies: 3 },
]);

const L16: Listing = {
  id: "l_tvm_03",
  owner_id: "own_kerala_03",
  type: "flat",
  title: "Tulip Co-Living Studio",
  slug: slugify("Tulip Co-Living Studio Sasthamangalam"),
  description:
    "Stylish co-living studio in the upscale Sasthamangalam neighbourhood. Couple-friendly with society approval, fully furnished, in-house laundry, and walking distance to cafes and Vellayambalam.",
  city: "trivandrum",
  area: "Sasthamangalam",
  landmark: "Sasthamangalam Junction",
  approx_lat: 8.512,
  approx_lng: 76.961,
  gender_pref: "couple",
  wedge_tags: ["couple"],
  amenities: ["wifi", "ac", "laundry", "parking", "balcony", "hot_water"],
  house_rules: ["3 month minimum lease", "Society guest log", "No subletting"],
  status: "live",
  is_verified: true,
  total_beds: 1,
  total_vacancies: 1,
  created_at: "2026-02-14T00:00:00Z",
  updated_at: NOW,
};
L16.room_types = makeRoomTypes(L16.id, [
  { name: "Couple Studio", price_per_month: 17000, ac: true, attached_bathroom: true, occupancy: 2, vacancies: 1 },
]);

/* ============================================================
   CALICUT (2)
   ============================================================ */

const L17: Listing = {
  id: "l_clt_01",
  owner_id: "own_calicut_01",
  type: "hostel",
  title: "NIT Greens Hostel",
  slug: slugify("NIT Greens Hostel NIT Campus"),
  description:
    "Affordable engineering-student focused hostel walking distance from NIT Calicut main gate. Triple sharing, mess included, dedicated study floor, and 24/7 power backup during exam season.",
  city: "calicut",
  area: "NIT Campus",
  landmark: "NIT Calicut Main Gate",
  approx_lat: 11.321,
  approx_lng: 75.935,
  gender_pref: "men",
  wedge_tags: ["student", "men", "bachelor"],
  amenities: ["wifi", "food", "laundry", "power_backup", "study_room", "common_kitchen"],
  house_rules: ["Quiet hours 10pm-6am", "Mess timings fixed", "No outside food in study room"],
  status: "live",
  is_verified: true,
  total_beds: 60,
  total_vacancies: 15,
  created_at: "2026-01-30T00:00:00Z",
  updated_at: NOW,
};
L17.room_types = makeRoomTypes(L17.id, [
  { name: "Triple Sharing", price_per_month: 4800, ac: false, attached_bathroom: false, occupancy: 3, vacancies: 9 },
  { name: "Quad Sharing", price_per_month: 4200, ac: false, attached_bathroom: false, occupancy: 4, vacancies: 6 },
]);

const L18: Listing = {
  id: "l_clt_02",
  owner_id: "own_calicut_01",
  type: "pg",
  title: "Cyberpark Studio PG",
  slug: slugify("Cyberpark Studio PG Cyberpark"),
  description:
    "Modern studio-style PG inside the Cyberpark Calicut tech belt. Designed for working professionals — flexible meal timing, in-house cafe, dedicated parking, and high-speed internet.",
  city: "calicut",
  area: "Cyberpark",
  landmark: "Calicut Cyberpark",
  approx_lat: 11.273,
  approx_lng: 75.819,
  gender_pref: "any",
  wedge_tags: ["bachelor", "couple"],
  amenities: ["wifi", "food", "ac", "laundry", "parking", "power_backup", "housekeeping"],
  house_rules: ["Flexible entry with biometric", "Visitors register at lobby", "No smoking indoors"],
  status: "pending_review",
  is_verified: false,
  total_beds: 18,
  total_vacancies: 6,
  created_at: "2026-04-11T00:00:00Z",
  updated_at: NOW,
};
L18.room_types = makeRoomTypes(L18.id, [
  { name: "Studio Single AC", price_per_month: 13500, ac: true, attached_bathroom: true, occupancy: 1, vacancies: 3 },
  { name: "Double Sharing AC", price_per_month: 9000, ac: true, attached_bathroom: true, occupancy: 2, vacancies: 3 },
]);

/* ============================================================
   TRICHUR (2)
   ============================================================ */

const L19: Listing = {
  id: "l_trc_01",
  owner_id: "own_kerala_02",
  type: "pg",
  title: "Medico PG",
  slug: slugify("Medico PG Medical College"),
  description:
    "Medical-student-focused PG opposite Government Medical College Thrissur. Quiet study environment, midnight library access, 24/7 power backup, and on-call mess service for night-shift PG students.",
  city: "trichur",
  area: "Medical College",
  landmark: "Government Medical College",
  approx_lat: 10.547,
  approx_lng: 76.207,
  gender_pref: "women",
  wedge_tags: ["women", "student"],
  amenities: ["wifi", "food", "laundry", "hot_water", "study_room", "power_backup", "security"],
  house_rules: ["Quiet floor on study level", "Entry pass after 10 PM", "Visitors at warden discretion"],
  status: "live",
  is_verified: true,
  total_beds: 24,
  total_vacancies: 4,
  created_at: "2025-12-22T00:00:00Z",
  updated_at: NOW,
};
L19.room_types = makeRoomTypes(L19.id, [
  { name: "Single AC", price_per_month: 9500, ac: true, attached_bathroom: true, occupancy: 1, vacancies: 1 },
  { name: "Double Sharing", price_per_month: 6800, ac: false, attached_bathroom: true, occupancy: 2, vacancies: 3 },
]);

const L20: Listing = {
  id: "l_trc_02",
  owner_id: "own_kerala_03",
  type: "flat",
  title: "Town Hall Family Flat",
  slug: slugify("Town Hall Family Flat Town Hall"),
  description:
    "Spacious 2BHK family flat near Trichur Town Hall. Walking distance to Round, schools, and the railway station. Suitable for working couples and small families, with society playground and 24/7 security.",
  city: "trichur",
  area: "Town Hall",
  landmark: "Trichur Round",
  approx_lat: 10.521,
  approx_lng: 76.214,
  gender_pref: "family",
  wedge_tags: ["family", "couple", "pet"],
  amenities: ["wifi", "parking", "balcony", "security", "power_backup", "housekeeping"],
  house_rules: ["Pets allowed (small / medium)", "Long-stay 6 months", "Society visitor approval"],
  status: "live",
  is_verified: true,
  total_beds: 2,
  total_vacancies: 1,
  created_at: "2026-02-28T00:00:00Z",
  updated_at: NOW,
};
L20.room_types = makeRoomTypes(L20.id, [
  { name: "2BHK Whole Flat", price_per_month: 19500, ac: false, attached_bathroom: true, occupancy: 4, vacancies: 1 },
]);

/* ============================================================
   Master list + accessors
   ============================================================ */

const ALL_LISTINGS: Listing[] = [
  L1, L2, L3, L4, L5, L6,
  L7, L8, L9, L10,
  L11, L12, L13,
  L14, L15, L16,
  L17, L18,
  L19, L20,
];

export function getAllListings(): Listing[] {
  return ALL_LISTINGS;
}

export function getListingsByCity(city: string, limit?: number): Listing[] {
  const filtered = ALL_LISTINGS.filter(
    (l) => l.city.toLowerCase() === city.toLowerCase(),
  );
  return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
}

export function getListingsByWedge(
  wedge: WedgeTag,
  city?: string,
  limit?: number,
): Listing[] {
  let filtered = ALL_LISTINGS.filter((l) => l.wedge_tags.includes(wedge));
  if (city) {
    filtered = filtered.filter(
      (l) => l.city.toLowerCase() === city.toLowerCase(),
    );
  }
  return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
}

export function getListingBySlug(
  city: string,
  slug: string,
): Listing | undefined {
  return ALL_LISTINGS.find(
    (l) =>
      l.city.toLowerCase() === city.toLowerCase() &&
      l.slug.toLowerCase() === slug.toLowerCase(),
  );
}

/**
 * Returns ~6 verified listings, mixed from top cities,
 * to feed the homepage "Featured" section.
 */
export function getFeaturedListings(limit = 6): Listing[] {
  const verified = ALL_LISTINGS.filter((l) => l.is_verified);
  const featuredOrder = [
    "l_koc_01", // Sunshine PG (Kochi women)
    "l_blr_01", // Pawfect Home (Bangalore pet)
    "l_koc_03", // Casa Cozy (Kochi couple)
    "l_chn_01", // Lakshmi Hostel (Chennai women)
    "l_tvm_01", // PrimeStay (Trivandrum techie)
    "l_blr_03", // Brindavan Bachelors (Bangalore men)
    "l_koc_02", // Techie Nest PG (Kochi men)
    "l_clt_01", // NIT Greens Hostel (Calicut student)
  ];
  const sorted = featuredOrder
    .map((id) => verified.find((l) => l.id === id))
    .filter((l): l is Listing => !!l);
  return sorted.slice(0, limit);
}

/**
 * Returns the minimum price across a listing's room_types, or null
 * when no room types are present.
 */
export function getListingMinPrice(l: Listing): number | null {
  if (!l.room_types || l.room_types.length === 0) return null;
  return Math.min(...l.room_types.map((rt) => rt.price_per_month));
}

/**
 * Stable gradient pair derived from the listing id, used for
 * placeholder photos. Returns a CSS `linear-gradient(...)` string.
 */
export function getListingGradient(id: string): string {
  const PALETTES: Array<[string, string]> = [
    ["#FB7185", "#F0B429"], // rose -> amber
    ["#6366F1", "#38BDF8"], // indigo -> sky
    ["#14B8A6", "#84CC16"], // teal -> lime
    ["#F59E0B", "#EC4899"], // amber -> pink
    ["#8B5CF6", "#06B6D4"], // violet -> cyan
    ["#EF4444", "#F59E0B"], // red -> amber
    ["#10B981", "#3B82F6"], // emerald -> blue
    ["#F0B429", "#CB6E17"], // brand -> deep brand
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const [a, b] = PALETTES[Math.abs(hash) % PALETTES.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}
