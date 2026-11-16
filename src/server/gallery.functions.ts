import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "../../db/index.js"
import { galleryImages } from "../../db/schema.js"
import { desc, eq } from "drizzle-orm"
import { getStore } from "@netlify/blobs"
import { requireAuthMiddleware } from "../middleware/identity"

export const listGallery = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(galleryImages).orderBy(desc(galleryImages.createdAt))
})

export const uploadGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData }) => {
    const file = formData.get("file") as File
    const caption = (formData.get("caption") as string) || ""
    const category = (formData.get("category") as string) || "general"

    const key = `gallery/${Date.now()}-${file.name}`
    const store = getStore("gallery-photos")
    await store.set(key, await file.arrayBuffer())

    const [row] = await db
      .insert(galleryImages)
      .values({ blobKey: key, caption, category })
      .returning()
    return row
  })

export const deleteGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const [row] = await db.select().from(galleryImages).where(eq(galleryImages.id, data.id))
    if (row) {
      const store = getStore("gallery-photos")
      await store.delete(row.blobKey)
      await db.delete(galleryImages).where(eq(galleryImages.id, data.id))
    }
    return { success: true }
  })
