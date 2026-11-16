import { HeadContent, Scripts, createRootRoute, Outlet } from "@tanstack/react-router"
import { IdentityProvider } from "../lib/identity-context"
import { CallbackHandler } from "../components/CallbackHandler"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { EmergencyBanner } from "../components/EmergencyBanner"
import { LOGO_FULL_SRC } from "../lib/business"

import "../styles.css"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Boyd Glass Service | Window, Shower Door & Commercial Glass Experts" },
      {
        name: "description",
        content:
          "Boyd Glass Service provides professional window glass replacement, shower door installation, and commercial storefront glass repair. Get an instant online estimate or schedule an appointment today.",
      },
      { name: "theme-color", content: "#1d4ed8" },
      { property: "og:image", content: LOGO_FULL_SRC },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-white text-slate-800 antialiased">
        <IdentityProvider>
          <CallbackHandler>
            <EmergencyBanner />
            <Header />
            <main className="min-h-screen">{children ?? <Outlet />}</main>
            <Footer />
          </CallbackHandler>
        </IdentityProvider>
        <Scripts />
      </body>
    </html>
  )
}
