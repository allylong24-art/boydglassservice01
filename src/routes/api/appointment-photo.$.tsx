import { createFileRoute } from "@tanstack/react-router"
import { getStore } from "@netlify/blobs"
import { getUser } from "@netlify/identity"

export const Route = createFileRoute("/api/appointment-photo/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const user = await getUser()
        if (!user) return new Response("Unauthorized", { status: 401 })
        const key = `appointments/${params._splat}`
        const store = getStore("appointment-photos")
        const blob = await store.get(key, { type: "blob" })
        if (!blob) return new Response("Not found", { status: 404 })
        return new Response(blob, { headers: { "Content-Type": "image/*" } })
      },
    },
  },
})
