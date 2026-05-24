/**
 * Mock owner profiles for demo data.
 * Will be replaced by Supabase `owners` table queries in Phase 1.
 *
 * Keep this file as a plain `.ts` (no "use client") so server components
 * can safely import the constants — see Mistakes Log entry #2.
 */
import type { Owner } from "./types";

export const MOCK_OWNERS: Owner[] = [
  {
    id: "own_kerala_01",
    profile_id: "prof_kerala_01",
    tier: "full_service",
    business_name: "Sundaram Properties",
    kyc_status: "verified",
    contact_phone: "+919876500001",
    has_verification_badge: true,
    verification_expires_at: "2027-05-23T00:00:00Z",
    registered_at: "2025-09-12T00:00:00Z",
    registration_expires_at: "2026-09-12T00:00:00Z",
  },
  {
    id: "own_kerala_02",
    profile_id: "prof_kerala_02",
    tier: "full_service",
    business_name: "Krishna Hospitality",
    kyc_status: "verified",
    contact_phone: "+919876500002",
    has_verification_badge: true,
    verification_expires_at: "2027-05-23T00:00:00Z",
    registered_at: "2025-08-04T00:00:00Z",
    registration_expires_at: "2026-08-04T00:00:00Z",
  },
  {
    id: "own_kerala_03",
    profile_id: "prof_kerala_03",
    tier: "self_serve",
    business_name: "Mariamma George",
    kyc_status: "verified",
    contact_phone: "+919876500003",
    has_verification_badge: true,
    registered_at: "2025-10-19T00:00:00Z",
    registration_expires_at: "2026-10-19T00:00:00Z",
  },
  {
    id: "own_blr_01",
    profile_id: "prof_blr_01",
    tier: "full_service",
    business_name: "Bengaluru Stays Pvt Ltd",
    kyc_status: "verified",
    contact_phone: "+919876500004",
    has_verification_badge: true,
    verification_expires_at: "2027-05-23T00:00:00Z",
    registered_at: "2025-11-02T00:00:00Z",
    registration_expires_at: "2026-11-02T00:00:00Z",
  },
  {
    id: "own_blr_02",
    profile_id: "prof_blr_02",
    tier: "self_serve",
    business_name: "Anita Reddy Rentals",
    kyc_status: "verified",
    contact_phone: "+919876500005",
    has_verification_badge: false,
    registered_at: "2026-01-15T00:00:00Z",
    registration_expires_at: "2027-01-15T00:00:00Z",
  },
  {
    id: "own_chn_01",
    profile_id: "prof_chn_01",
    tier: "full_service",
    business_name: "Saravana Bhavan PG",
    kyc_status: "verified",
    contact_phone: "+919876500006",
    has_verification_badge: true,
    verification_expires_at: "2027-05-23T00:00:00Z",
    registered_at: "2025-12-07T00:00:00Z",
    registration_expires_at: "2026-12-07T00:00:00Z",
  },
  {
    id: "own_chn_02",
    profile_id: "prof_chn_02",
    tier: "self_serve",
    business_name: "Faisal Ahmed Properties",
    kyc_status: "verified",
    contact_phone: "+919876500007",
    has_verification_badge: true,
    registered_at: "2026-02-11T00:00:00Z",
    registration_expires_at: "2027-02-11T00:00:00Z",
  },
  {
    id: "own_calicut_01",
    profile_id: "prof_calicut_01",
    tier: "self_serve",
    business_name: "Suja Nambiar",
    kyc_status: "verified",
    contact_phone: "+919876500008",
    has_verification_badge: false,
    registered_at: "2026-03-04T00:00:00Z",
    registration_expires_at: "2027-03-04T00:00:00Z",
  },
];

export function getOwnerById(id: string): Owner | undefined {
  return MOCK_OWNERS.find((o) => o.id === id);
}
