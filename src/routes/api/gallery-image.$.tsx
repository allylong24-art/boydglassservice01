import { createFileRoute } from "@tanstack/react-router"
import { getStore } from "@netlify/blobs"

export const Route = createFileRoute("/api/gallery-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = `gallery/${params._splat}`
        const store = getStore("gallery-photos")
        const blob = await store.get(key, { type: "blob" })
        if (!blob) {
          return new Response("Not found", { status: 404 })
        }
        return new Response(blob, {
          headers: { "Content-Type": "image/*", "Cache-Control": "public, max-age=3600" },
        })
      },
    },
  },
})
