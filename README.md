# Boyd Glass Service

A modern, mobile-friendly marketing and operations website for Boyd Glass Service — a residential and commercial glass repair and installation company. Customers can get an instant online estimate, book an appointment with photo uploads, pay a deposit, leave reviews, and browse a project gallery. Staff manage everything through a secure admin dashboard.

## Key features

- **Instant Estimate Calculator** for Window Glass Replacement, Shower Door Installation, and Commercial/Storefront Glass — takes measurements, glass type, quantity, labor option, and add-ons, then computes materials, labor, fees, and tax live. Estimates can be saved, printed, emailed, or downloaded as a PDF.
- **Appointment Scheduling** with date/time selection, contact info, and job photo uploads. Booking triggers an automatic email confirmation.
- **Admin Dashboard** (behind Netlify Identity login) for managing appointments, editing pricing/labor rates, viewing saved estimates, moderating reviews, uploading gallery photos, and exporting customer data to CSV.
- **Stripe Checkout** integration for paying deposits or invoices online.
- **Homepage** with hero CTAs, reviews, gallery preview, Google Maps embed, and an emergency service banner.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, server functions) on Vite
- Tailwind CSS v4
- [Netlify Database](https://docs.netlify.com/database) (managed Postgres) via Drizzle ORM — estimates, appointments, reviews, gallery metadata, pricing config
- [Netlify Blobs](https://docs.netlify.com/blobs) — gallery and appointment photo storage
- [Netlify Identity](https://docs.netlify.com/identity) — admin authentication
- [Netlify Forms](https://docs.netlify.com/forms) — contact form
- [Stripe](https://stripe.com) — deposit/invoice checkout
- [Resend](https://resend.com) — appointment confirmation emails
- `jspdf` — client-side estimate PDF generation

## Business contact details

Phone, email, address, service area, and opening hours live in one place:
`src/lib/business.ts`. The header, footer, emergency banner, home page, and
contact page all read from it, and the Google Maps embeds are generated from the
address — so each detail only needs to be changed once. A field left as an empty
string is omitted from the page rather than rendered as an empty row. Opening
hours are currently blank, so the "Hours" rows stay hidden until they are filled
in.

## Logo

`public/images/logo-wordmark.png` is the company sign cropped to the wordmark and
tagline, and is what the header and footer display. `public/images/logo.png` is
the complete sign including the phone number and address, used as the social
sharing preview image. Both are referenced through `LOGO_SRC` and
`LOGO_FULL_SRC` in `src/lib/business.ts`; if `LOGO_SRC` is emptied or the image
fails to load, `src/components/Logo.tsx` falls back to a "BG" monogram so the
header is never blank.

## Site photography

The About and Services pages use these images from `public/images/`:

| Path | Used on | Status |
| --- | --- | --- |
| `public/images/about/team-workshop.jpg` | About — "Our Story" | in place |
| `public/images/services/window-glass-replacement.jpg` | Services — Window Glass Replacement | in place |
| `public/images/services/commercial-storefront-glass.jpg` | Services — Commercial / Storefront Glass | in place |
| `public/images/services/shower-door-installation.jpg` | Services — Shower Door Installation | **still needed** |

They are rendered at a 4:3 aspect ratio and cropped to fill, so landscape shots
of roughly 1200×900 or larger work best. A service whose `image` is left `null`
in `src/routes/services.tsx` renders as a single full-width column with no empty
box, which is how Shower Door Installation currently appears — dropping a photo
at the path above and setting `image` restores the two-column layout.

## Project gallery

The gallery combines two sources:

- **Featured photos** listed in `src/lib/featuredGallery.ts` and committed to
  `public/images/gallery/`. These ship with the site and appear on both the
  gallery page and the home page's "Recent Projects" strip.
- **Admin uploads** added through the dashboard's Gallery tab, stored in Netlify
  Blobs and served via `/api/gallery-image/*`.

`mergeGallery()` combines them, featured first. Both sources share the same
category filters (window, shower, commercial, auto, general), so a photo added
either way can be filtered on the gallery page.

## Running locally

```bash
npm install
npm run dev
```

The dev server runs on Vite. Some Netlify-only features (Identity login, Blobs, Forms) require a real Netlify deployment to fully test — use `netlify dev` to emulate most of the platform locally, or test on a deploy preview.

## Environment variables

Copy `.env.example` to `.env` and fill in what you need:

- `STRIPE_SECRET_KEY` — enables the Stripe checkout flow for deposits. Without it, checkout returns a friendly "not configured" message.
- `RESEND_API_KEY` / `EMAIL_FROM` — enables appointment confirmation emails via Resend. Without it, the booking flow still works; emails are just skipped (logged to the function console).

## Admin access

Visit `/admin`. Netlify Identity registration is open by default — the first person to sign up should switch **Registration** to "Invite only" in Project configuration > Identity once the real admin account exists. Identity sign-in only works on a deployed site, not on `localhost`.
