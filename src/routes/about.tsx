import { createFileRoute } from "@tanstack/react-router"
import { PageHero } from "../components/PageHero"
import { ShieldCheck, Award, Users, Clock } from "lucide-react"

export const Route = createFileRoute("/about")({
  component: AboutPage,
})

const VALUES = [
  { icon: ShieldCheck, title: "Licensed & Insured", desc: "Fully licensed and insured for both residential and commercial glass work." },
  { icon: Award, title: "25+ Years Experience", desc: "Two decades of craftsmanship trusted by homeowners and businesses across the region." },
  { icon: Users, title: "Family Owned", desc: "A local, family-owned business that treats every job like it's for our own home." },
  { icon: Clock, title: "Fast Turnaround", desc: "Most residential jobs completed same-day or next-day, with emergency service available." },
]

function AboutPage() {
  return (
    <div>
      <PageHero
        title="About Boyd Glass Service"
        subtitle="Two decades of expert glass repair, replacement, and installation for homes and businesses."
      />

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Our Story</h2>
            <p className="text-slate-600 leading-relaxed">
              Boyd Glass Service was founded on a simple principle: do quality glass work, price it fairly,
              and show up when we say we will. What started as a single-van residential window repair business
              has grown into a full-service glass company handling everything from shower enclosures to
              commercial storefronts — without losing the personal, local touch that built our reputation.
            </p>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Every technician on our team is trained, background-checked, and committed to leaving your home
              or business cleaner than we found it. We stand behind every installation with a workmanship
              guarantee.
            </p>
          </div>
          <img
            src="/images/about/team-workshop.jpg"
            alt="The Boyd Glass Service team at the workshop"
            loading="lazy"
            className="rounded-xl bg-slate-100 aspect-[4/3] w-full object-cover"
          />
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">Why Homeowners &amp; Businesses Choose Us</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl bg-white border border-slate-200 p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 mb-4">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-800">{v.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
