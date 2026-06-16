/**
 * Tests for redactContactInfo — the load-bearing anti-disintermediation regex.
 *
 * Run with:
 *   npm run test            # vitest run (CI / one-shot)
 *   npm run test:watch      # vitest watch (dev)
 *
 * NOTE: vitest is added as a devDependency but not yet installed in the local
 * node_modules if you haven't run `npm install` since the package.json change.
 * Run `npm install` once, then `npm run test`.
 */

// vitest types are provided by the vitest package itself — no separate @types needed.
import { describe, it, expect } from "vitest";
import { redactContactInfo } from "./utils";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function shouldRedact(input: string) {
  return redactContactInfo(input).hadContact === true;
}

function shouldPass(input: string) {
  return redactContactInfo(input).hadContact === false;
}

// ---------------------------------------------------------------------------
// SHOULD REDACT
// ---------------------------------------------------------------------------

describe("redactContactInfo — should redact", () => {
  it("standard 10-digit Indian phone", () => {
    expect(shouldRedact("Call me on 9876543210")).toBe(true);
  });

  it("phone with +91 country code", () => {
    expect(shouldRedact("+91 98765 43210")).toBe(true);
  });

  it("explicit phone reveal phrase", () => {
    expect(shouldRedact("my number is 9876543210")).toBe(true);
  });

  it("all word-form digits (nine nine five three…)", () => {
    expect(
      shouldRedact("ph: nine nine five three four two five nine nine nine"),
    ).toBe(true);
  });

  it("mixed digit + word-form (99five34twofive99)", () => {
    expect(shouldRedact("99five34twofive99")).toBe(true);
  });

  it("no-space mixed word-form (9nine9eight7eight6three5two1zero)", () => {
    expect(shouldRedact("9nine9eight7eight6three5two1zero")).toBe(true);
  });

  it("dashed word-form digits", () => {
    expect(
      shouldRedact("nine-nine-five-three-four-two-five-nine-nine-nine"),
    ).toBe(true);
  });

  it("dashed separated digits (9-99-78-990-9)", () => {
    expect(shouldRedact("9-99-78-990-9")).toBe(true);
  });

  it("spaced separated digits", () => {
    expect(shouldRedact("99 99 78 990 9")).toBe(true);
  });

  it("lowercase o for zero l33t (9o9o78989o)", () => {
    expect(shouldRedact("call me 9o9o78989o")).toBe(true);
  });

  it("wa.me link", () => {
    expect(shouldRedact("wa.me/919876543210")).toBe(true);
  });

  it("telegram link", () => {
    expect(shouldRedact("https://t.me/myhandle")).toBe(true);
  });

  it("standard email", () => {
    expect(shouldRedact("Email: name@example.com")).toBe(true);
  });

  it("obfuscated email (name at gmail dot com)", () => {
    expect(shouldRedact("name at gmail dot com")).toBe(true);
  });

  it("standard UPI ID", () => {
    expect(shouldRedact("pay me at rajesh@oksbi")).toBe(true);
  });

  it("WhatsApp link", () => {
    expect(shouldRedact("contact via whatsapp link: chat.whatsapp.com/abc123")).toBe(
      true,
    );
  });

  it("instagram link", () => {
    expect(shouldRedact("instagram.com/pgowner99")).toBe(true);
  });

  it("social handle with embedded digits (insta @rajpg9876543)", () => {
    expect(shouldRedact("DM me on insta @rajpg9876543")).toBe(true);
  });

  it("contact phrase — 'call me'", () => {
    expect(shouldRedact("call me for details")).toBe(true);
  });

  it("contact phrase — 'whatsapp me'", () => {
    expect(shouldRedact("whatsapp me for photos")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SHOULD NOT REDACT
// ---------------------------------------------------------------------------

describe("redactContactInfo — should NOT redact", () => {
  it("price with 4 digits (Rs 9,500/month)", () => {
    expect(shouldPass("Rent is Rs 9,500/month")).toBe(true);
  });

  it("4-digit price (Rs 9999 per month)", () => {
    expect(shouldPass("Rs 9999 per month all-inclusive")).toBe(true);
  });

  it("time of day (9am to 9pm)", () => {
    expect(shouldPass("Doors open 9am to 9pm")).toBe(true);
  });

  it("small occupancy count (5 sharing room)", () => {
    expect(shouldPass("5 sharing room available")).toBe(true);
  });

  it("small friend count (3 friends)", () => {
    expect(shouldPass("I have 3 friends here")).toBe(true);
  });

  it("room number (Room 305, floor 2)", () => {
    expect(shouldPass("Room 305, floor 2")).toBe(true);
  });

  it("venue name with digits (99 Comfort Inn)", () => {
    expect(shouldPass("PG name is 99 Comfort Inn")).toBe(true);
  });

  it("distance (5 km from station)", () => {
    expect(shouldPass("5 km from station")).toBe(true);
  });

  it("to-call verb phrase (not a contact phrase)", () => {
    expect(shouldPass("I have to call the owner tomorrow")).toBe(true);
  });

  it("rupee price (₹8500 monthly)", () => {
    expect(shouldPass("₹8500 monthly")).toBe(true);
  });
});
