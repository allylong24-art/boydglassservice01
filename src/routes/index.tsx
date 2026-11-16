import { createFileRoute, Link } from "@tanstack/react-router"
import {
  Calculator,
  CalendarCheck,
  ShieldCheck,
  Clock,
  Award,
  Wrench,
  DoorOpen,
  Building2,
  MapPin,
  Phone,
  Mail,
} from "lucide-react"
import { listReviews } from "../server/reviews.functions"
import { listGallery } from "../server/gallery.functions"
import { mergeGallery } from "../lib/featuredGallery"
import { ReviewStars } from "../components/ReviewStars"
import {
  BUSINESS,
  addressLine,
  hasAddress,
  hasEmail,
  hasHours,
  hasPhone,
  mapEmbedUrl,
  phoneHref,
} from "../lib/business"

export const Route = createFileRoute("/")({
  loader: async () => {
    const [reviews, gallery] = await Promise.all([listReviews(), listGallery()])
    return { reviews: reviews.slice(0, 3), gallery }
  },
  component: HomePage,
})

const SERVICES = [
  {
    icon: Wrench,
    title: "Window Glass Replacement",
    desc: "Fast, precise replacement for cracked, foggy, or drafty window panes — residential and commercial.",
  },
  {
    icon: DoorOpen,
    title: "Shower Door Installation",
    desc: "Custom frameless and framed shower enclosures built to fit your bathroom exactly.",
  },
  {
    icon: Building2,
    title: "Commercial / Storefront Glass",
    desc: "Storefront glass, curtain wall, and security glazing for businesses that can't afford downtime.",
  },
]

const TRUST = [
  { icon: ShieldCheck, label: "Licensed & Insured" },
  { icon: Award, label: "25+ Years Experience" },
  { icon: Clock, label: "Same-Day Emergency Service" },
]

function HomePage() {
  const { reviews, gallery } = Route.useLoaderData()
  const projects = mergeGallery(gallery).slice(0, 6)

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            {BUSINESS.serviceArea && (
              <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-blue-100 mb-5">
                {BUSINESS.serviceArea}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Glass Repair &amp; Installation You Can Trust
            </h1>
            <p className="mt-6 text-lg text-blue-100 max-w-xl">
              From cracked windows to custom shower enclosures and commercial storefronts —
              Boyd Glass Service delivers precision craftsmanship, fast turnaround, and honest pricing.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/estimate"
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3.5 text-base font-semibold text-blue-800 shadow-lg hover:bg-blue-50 transition-colors"
              >
                <Calculator className="h-5 w-5" />
                Get an Instant Estimate
              </Link>
              <Link
                to="/schedule"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3.5 text-base font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-blue-500 transition-colors"
              >
                <CalendarCheck className="h-5 w-5" />
                Schedule Appointment
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-6">
              {TRUST.map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-sm text-blue-100">
                  <t.icon className="h-5 w-5 text-blue-300" />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800">Our Core Services</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Get a free instant estimate for any of our specialty glass services below.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700 mb-5">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                <Link to="/estimate" className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900">
                  Get Estimate &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold text-slate-800">Recent Projects</h2>
              <Link to="/gallery" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                View Full Gallery &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map((g) => (
                <div key={g.key} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <img
                    src={g.src}
                    alt={g.caption || "Project photo"}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">What Our Customers Say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
                  <ReviewStars rating={r.rating} />
                  <p className="mt-4 text-sm text-slate-600 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold text-slate-800">{r.customerName}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/reviews" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                Read More Reviews &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 items-start ${mapEmbedUrl ? "md:grid-cols-2" : ""}`}>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Visit or Call Us</h2>
            <div className="space-y-4 text-slate-600">
              {hasAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-700 mt-0.5" />
                  <span>{addressLine}</span>
                </div>
              )}
              {hasPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-700" />
                  <a href={phoneHref} className="hover:text-blue-700">{BUSINESS.phone}</a>
                </div>
              )}
              {hasEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-700" />
                  <a href={`mailto:${BUSINESS.email}`} className="hover:text-blue-700">{BUSINESS.email}</a>
                </div>
              )}
              {hasHours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-700 mt-0.5" />
                  <span>
                    {[BUSINESS.hours, BUSINESS.emergencyHours].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>
            <Link
              to="/contact"
              className="mt-8 inline-flex items-center rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
            >
              Contact Us
            </Link>
          </div>
          {mapEmbedUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm h-80">
              <iframe
                title="Boyd Glass Service Location"
                className="w-full h-full"
                loading="lazy"
                src={mapEmbedUrl}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
