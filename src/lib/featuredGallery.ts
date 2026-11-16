// Curated project photos that ship with the site, shown alongside anything
// uploaded through the admin dashboard's Gallery tab. Files live in
// `public/images/gallery/`.

export type FeaturedPhoto = {
  src: string
  caption: string
  category: "window" | "shower" | "commercial" | "auto" | "general"
}

export const FEATURED_GALLERY: FeaturedPhoto[] = [
  {
    src: "/images/gallery/commercial-curtain-wall.jpg",
    caption: "Curtain wall glazing at a commercial building",
    category: "commercial",
  },
  {
    src: "/images/gallery/window-sash-reglazing.jpg",
    caption: "Reglazing a wood window sash in the shop",
    category: "window",
  },
  {
    src: "/images/gallery/workshop-glass-panel.jpg",
    caption: "Fitting a replacement glass panel in the shop",
    category: "window",
  },
  {
    src: "/images/gallery/auto-windshield-replacement.jpg",
    caption: "Mobile windshield replacement",
    category: "auto",
  },
]

export type GalleryPhoto = {
  key: string
  src: string
  caption: string | null
  category: string
}

type UploadedImage = {
  id: number
  blobKey: string
  caption: string | null
  category: string
}

/** Featured photos first, then photos uploaded through the admin dashboard. */
export function mergeGallery(uploaded: UploadedImage[]): GalleryPhoto[] {
  return [
    ...FEATURED_GALLERY.map((p) => ({
      key: p.src,
      src: p.src,
      caption: p.caption,
      category: p.category,
    })),
    ...uploaded.map((img) => ({
      key: `upload-${img.id}`,
      src: `/api/gallery-image/${img.blobKey.replace("gallery/", "")}`,
      caption: img.caption,
      category: img.category,
    })),
  ]
}
