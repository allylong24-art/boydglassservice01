import { Link } from "@tanstack/react-router"
import { Phone, Mail, MapPin, Clock } from "lucide-react"
import {
  BUSINESS,
  addressShort,
  hasAddress,
  hasContactDetails,
  hasEmail,
  hasHours,
  hasPhone,
  phoneHref,
} from "../lib/business"
import { Logo } from "./Logo"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Logo
                imgClassName="h-14 w-auto max-w-full object-contain"
                monogramClassName="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold"
              />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Trusted residential and commercial glass repair, replacement, and installation.
              Licensed, insured, and locally owned.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/estimate" className="hover:text-white transition-colors">Instant Estimate</Link></li>
              <li><Link to="/schedule" className="hover:text-white transition-colors">Schedule Appointment</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors">Gallery</Link></li>
              <li><Link to="/reviews" className="hover:text-white transition-colors">Reviews</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Services</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Window Glass Replacement</li>
              <li>Shower Door Installation</li>
              <li>Commercial / Storefront Glass</li>
              <li>Emergency Board-Up &amp; Repair</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              {hasPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <a href={phoneHref} className="hover:text-white transition-colors">{BUSINESS.phone}</a>
                </li>
              )}
              {hasEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <a href={`mailto:${BUSINESS.email}`} className="hover:text-white transition-colors">{BUSINESS.email}</a>
                </li>
              )}
              {hasAddress && (
                <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-blue-400 mt-0.5" /> {addressShort}</li>
              )}
              {hasHours && (
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-400 mt-0.5" />
                  <span>
                    {BUSINESS.hours}
                    {BUSINESS.hours && BUSINESS.emergencyHours && <br />}
                    {BUSINESS.emergencyHours}
                  </span>
                </li>
              )}
              {!hasContactDetails && (
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">Send us a message &rarr;</Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Boyd Glass Service. All rights reserved.</p>
          <p>Licensed &amp; Insured Glass Contractor</p>
        </div>
      </div>
    </footer>
  )
}
