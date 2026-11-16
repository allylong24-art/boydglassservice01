// Single source of truth for Boyd Glass Service's public contact details.
//
// The header, footer, emergency banner, home page, and contact page all read
// from this file, so each detail only needs to be updated once. Any field left
// as an empty string is omitted from the UI entirely rather than rendered as an
// empty row, so it is always safe to fill these in gradually.

export const BUSINESS = {
  name: "Boyd Glass Service",
  /** Display form, exactly as it should appear on the site. */
  phone: "(803) 991-1281",
  email: "boydglasscsra@gmail.com",
  address: {
    street: "103 Foreman Road",
    city: "Jackson",
    /** State or province abbreviation. */
    region: "SC",
    postalCode: "29831",
  },
  /** Shown as a badge on the home page hero. */
  serviceArea: "Serving Jackson, SC & Surrounding Areas",
  /** Regular opening hours, e.g. "Mon–Sat: 7:00am – 6:00pm". */
  hours: "",
  /** Optional second line under the hours, e.g. "Emergency service 24/7". */
  emergencyHours: "",
}

/**
 * Path to the logo image in `public/`. Left empty, the header and footer fall
 * back to the "BG" monogram. This is the wordmark-only crop of the company sign;
 * `LOGO_FULL_SRC` is the complete sign including phone number and address.
 */
export const LOGO_SRC = "/images/logo-wordmark.png"

/** The full company sign, used as the social sharing image. */
export const LOGO_FULL_SRC = "/images/logo.png"

const phoneDigits = BUSINESS.phone.replace(/[^\d+]/g, "")

/** `tel:` target for `BUSINESS.phone`, or "" when no phone is configured. */
export const phoneHref = BUSINESS.phone
  ? `tel:${phoneDigits.length === 10 ? `+1${phoneDigits}` : phoneDigits}`
  : ""

/** City, region and postal code, e.g. "Jackson, SC 29831". */
const locality = [
  [BUSINESS.address.city, BUSINESS.address.region].filter(Boolean).join(", "),
  BUSINESS.address.postalCode,
]
  .filter(Boolean)
  .join(" ")

/** Full address on one line, e.g. "103 Foreman Road, Jackson, SC 29831". */
export const addressLine = [BUSINESS.address.street, locality]
  .filter(Boolean)
  .join(", ")

/** Address without the postal code, for narrow columns. */
export const addressShort = [
  BUSINESS.address.street,
  [BUSINESS.address.city, BUSINESS.address.region].filter(Boolean).join(", "),
]
  .filter(Boolean)
  .join(", ")

/** Google Maps embed for the address, or "" when no address is configured. */
export const mapEmbedUrl = addressLine
  ? `https://www.google.com/maps?q=${encodeURIComponent(addressLine)}&output=embed`
  : ""

export const hasPhone = Boolean(BUSINESS.phone)
export const hasEmail = Boolean(BUSINESS.email)
export const hasAddress = Boolean(addressLine)
export const hasHours = Boolean(BUSINESS.hours || BUSINESS.emergencyHours)
export const hasContactDetails = hasPhone || hasEmail || hasAddress || hasHours
