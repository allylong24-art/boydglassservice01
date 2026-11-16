import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { PageHero } from "../components/PageHero"
import { Phone, Mail, MapPin, Clock } from "lucide-react"
import {
  BUSINESS,
  addressLine,
  hasAddress,
  hasContactDetails,
  hasEmail,
  hasHours,
  hasPhone,
  mapEmbedUrl,
  phoneHref,
} from "../lib/business"

export const Route = createFileRoute("/contact")({
  component: ContactPage,
})

function encode(data: Record<string, string>) {
  return Object.entries(data)
    .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
    .join("&")
}

function ContactPage() {
  const [fields, setFields] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields({ ...fields, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await fetch("/contact-form.html", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode({ "form-name": "contact", ...fields }),
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div>
      <PageHero title="Contact Us" subtitle="Questions about a project or estimate? We'd love to hear from you." />

      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-5 gap-12">
        {hasContactDetails && (
          <div className="md:col-span-2 space-y-6">
            {hasPhone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-blue-700 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Phone</div>
                  <a href={phoneHref} className="text-sm text-slate-600 hover:text-blue-700">{BUSINESS.phone}</a>
                </div>
              </div>
            )}
            {hasEmail && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-700 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Email</div>
                  <a href={`mailto:${BUSINESS.email}`} className="text-sm text-slate-600 hover:text-blue-700">{BUSINESS.email}</a>
                </div>
              </div>
            )}
            {hasAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-700 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Address</div>
                  <p className="text-sm text-slate-600">{addressLine}</p>
                </div>
              </div>
            )}
            {hasHours && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-700 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Hours</div>
                  <p className="text-sm text-slate-600">
                    {BUSINESS.hours}
                    {BUSINESS.hours && BUSINESS.emergencyHours && <br />}
                    {BUSINESS.emergencyHours}
                  </p>
                </div>
              </div>
            )}
            {mapEmbedUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm h-56">
                <iframe title="Location" className="w-full h-full" loading="lazy" src={mapEmbedUrl} />
              </div>
            )}
          </div>
        )}

        <div className={hasContactDetails ? "md:col-span-3" : "md:col-span-5"}>
          {submitted ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
              <h3 className="text-lg font-semibold text-green-800">Message sent!</h3>
              <p className="text-sm text-green-700 mt-2">Thanks for reaching out — we'll get back to you within one business day.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 p-8 shadow-sm">
              <input type="hidden" name="form-name" value="contact" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input name="name" required value={fields.name} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input name="phone" value={fields.phone} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" name="email" required value={fields.email} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input name="subject" value={fields.subject} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea name="message" required rows={5} value={fields.message} onChange={handleChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center rounded-md bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
