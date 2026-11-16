import { createFileRoute, Link } from "@tanstack/react-router"
import { PageHero } from "../components/PageHero"
import { Wrench, DoorOpen, Building2, CheckCircle2 } from "lucide-react"

export const Route = createFileRoute("/services")({
  component: ServicesPage,
})

const SERVICES = [
  {
    icon: Wrench,
    title: "Window Glass Replacement",
    desc: "Cracked, foggy, or drafty windows repaired or replaced with precision-cut glass matched to your existing frames.",
    image: "/images/services/window-glass-replacement.jpg",
    bullets: ["Single & double-pane replacement", "Low-E energy efficient glass", "Tempered safety glass", "Custom frame fitting"],
  },
  {
    icon: DoorOpen,
    title: "Shower Door Installation",
    desc: "Custom framed and frameless shower enclosures measured and installed to fit your bathroom exactly.",
    image: null as string | null,
    bullets: ["Frameless glass enclosures", "Sliding & hinged doors", "Frosted, tinted & clear glass", "Hardware & handle upgrades"],
  },
  {
    icon: Building2,
    title: "Commercial / Storefront Glass",
    desc: "Storefront glazing, curtain wall, and security glass for businesses — minimal downtime, maximum durability.",
    image: "/images/services/commercial-storefront-glass.jpg",
    bullets: ["Tempered storefront glass", "Laminated safety glass", "Insulated commercial units", "Impact & security glazing"],
  },
]

function ServicesPage() {
  return (
    <div>
      <PageHero title="Our Services" subtitle="Specialty glass work for homes and businesses, backed by an instant online estimate." />

      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {SERVICES.map((s, i) => (
          <div
            key={s.title}
            className={`grid gap-10 items-center rounded-xl border border-slate-200 p-8 shadow-sm ${
              s.image ? "md:grid-cols-2" : ""
            } ${s.image && i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700 mb-5">
                <s.icon className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{s.title}</h2>
              <p className="mt-3 text-slate-600 leading-relaxed">{s.desc}</p>
              <ul className="mt-5 space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to="/estimate"
                className="mt-6 inline-flex items-center rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
              >
                Get an Instant Estimate
              </Link>
            </div>
            {s.image && (
              <img
                src={s.image}
                alt={s.title}
                loading="lazy"
                className="rounded-xl bg-slate-100 aspect-[4/3] w-full object-cover"
              />
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
