import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { PageHero } from "../components/PageHero"
import { listGallery } from "../server/gallery.functions"
import { mergeGallery } from "../lib/featuredGallery"

export const Route = createFileRoute("/gallery")({
  loader: () => listGallery(),
  component: GalleryPage,
})

const CATEGORIES = ["all", "window", "shower", "commercial", "auto", "general"]

function GalleryPage() {
  const uploaded = Route.useLoaderData()
  const [filter, setFilter] = useState("all")

  const images = mergeGallery(uploaded)
  const filtered = filter === "all" ? images : images.filter((img) => img.category === filter)

  return (
    <div>
      <PageHero title="Project Gallery" subtitle="A look at some of our recent window, shower door, and commercial glass installations." compact />

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === c ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-16">No photos yet in this category. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((img) => (
              <div key={img.key} className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                <img
                  src={img.src}
                  alt={img.caption || "Project photo"}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
