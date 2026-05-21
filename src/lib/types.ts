/**
 * Shared TypeScript types for HostelPups.
 * These mirror the planned Supabase schema (to be created in Phase 1).
 */

export type PropertyType =
  | "pg"
  | "hostel"
  | "flat"
  | "house"
  | "staycation";

export type GenderPreference =
  | "any"
  | "men"
  | "women"
  | "couple"
  | "family";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "live"
  | "paused"
  | "full"
  | "rejected";

export type OwnerTier = "self_serve" | "full_service";

export type KycStatus =
  | "not_submitted"
  | "pending"
  | "verified"
  | "rejected";

export type UserRole = "user" | "owner" | "admin";

export type AccessTier =
  | "free"
  | "week"
  | "month"
  | "year"
  | "single_unlock";

export type WedgeTag =
  | "couple"
  | "bachelor"
  | "pet"
  | "student"
  | "family"
  | "women"
  | "men";

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  verified: boolean;
  created_at: string;
}

export interface Owner {
  id: string;
  profile_id: string;
  tier: OwnerTier;
  business_name: string;
  kyc_status: KycStatus;
  kyc_documents?: string[];
  contact_phone: string;
  has_verification_badge: boolean;
  verification_expires_at?: string;
  registered_at: string;
  registration_expires_at: string;
}

export interface RoomType {
  id: string;
  listing_id: string;
  name: string; // "Single", "Double Sharing", "Triple"
  price_per_month: number;
  ac: boolean;
  attached_bathroom: boolean;
  occupancy: number;
  vacancies: number;
}

export interface ListingPhoto {
  id: string;
  listing_id: string;
  url: string;
  order: number;
  is_cover: boolean;
}

export interface Amenity {
  key: string; // "wifi", "food", "laundry", "gym", "parking", ...
  label: string;
}

export interface Listing {
  id: string;
  owner_id: string;
  type: PropertyType;
  title: string;
  slug: string;
  description: string;
  city: string;
  area: string;
  address?: string; // gated behind paywall
  landmark?: string;
  lat?: number;
  lng?: number;
  approx_lat?: number; // public coarse location
  approx_lng?: number;
  gender_pref: GenderPreference;
  wedge_tags: WedgeTag[]; // couple-friendly, etc.
  amenities: string[];
  house_rules: string[];
  status: ListingStatus;
  is_verified: boolean;
  is_boosted_until?: string;
  available_from?: string;
  total_beds?: number;
  total_vacancies?: number;
  created_at: string;
  updated_at: string;

  // Joined data (when fetched with includes)
  photos?: ListingPhoto[];
  room_types?: RoomType[];
  owner?: Owner;
}

export interface Inquiry {
  id: string;
  user_id: string;
  listing_id: string;
  status: "open" | "responded" | "closed";
  created_at: string;
}

export interface Message {
  id: string;
  inquiry_id: string;
  sender_id: string;
  content: string;
  was_redacted: boolean;
  created_at: string;
}

export interface Favorite {
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  listing_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id?: string;
  owner_id?: string;
  amount: number;
  currency: "INR";
  purpose:
    | "user_access_week"
    | "user_access_month"
    | "user_access_year"
    | "user_single_unlock"
    | "owner_registration_full"
    | "owner_registration_self"
    | "owner_verification"
    | "owner_boost"
    | "owner_renewal";
  status: "pending" | "completed" | "failed" | "refunded";
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
}

export interface UserAccess {
  user_id: string;
  tier: AccessTier;
  expires_at?: string;
  contacts_unlocked: number;
  contacts_remaining: number;
}
