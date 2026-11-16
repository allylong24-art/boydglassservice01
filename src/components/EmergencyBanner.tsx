import { Link } from "@tanstack/react-router"
import { AlertTriangle } from "lucide-react"
import { BUSINESS, hasPhone, phoneHref } from "../lib/business"

export function EmergencyBanner() {
  return (
    <div className="bg-red-600 text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="font-medium">Broken glass emergency? We offer same-day emergency board-up &amp; repair.</span>
        {hasPhone && (
          <>
            <a href={phoneHref} className="font-bold underline underline-offset-2 hover:text-red-100">
              Call {BUSINESS.phone}
            </a>
            <span className="hidden sm:inline">or</span>
          </>
        )}
        <Link
          to="/schedule"
          className={`font-bold underline underline-offset-2 hover:text-red-100 ${hasPhone ? "hidden sm:inline" : ""}`}
        >
          Schedule Emergency Service
        </Link>
      </div>
    </div>
  )
}
