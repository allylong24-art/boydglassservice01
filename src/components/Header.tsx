import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { Menu, X, Phone } from "lucide-react"
import { BUSINESS, hasPhone, phoneHref } from "../lib/business"
import { Logo } from "./Logo"

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/estimate", label: "Instant Estimate" },
  { to: "/schedule", label: "Schedule" },
  { to: "/gallery", label: "Gallery" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <Logo
              imgClassName="h-11 sm:h-12 lg:h-14 w-auto object-contain"
              monogramClassName="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white font-bold text-lg shadow-sm group-hover:bg-blue-800 transition-colors"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors [&.active]:text-blue-700 [&.active]:bg-blue-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {hasPhone && (
              <a
                href={phoneHref}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-blue-700"
              >
                <Phone className="h-4 w-4" />
                {BUSINESS.phone}
              </a>
            )}
            <Link
              to="/estimate"
              className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
            >
              Get an Estimate
            </Link>
          </div>

          <button
            className="lg:hidden p-2 text-slate-600"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 [&.active]:text-blue-700 [&.active]:bg-blue-50"
              >
                {link.label}
              </Link>
            ))}
            {hasPhone && (
              <a href={phoneHref} className="px-3 py-2.5 text-sm font-semibold text-blue-700">
                Call {BUSINESS.phone}
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
