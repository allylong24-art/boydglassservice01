import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "../../db/index.js"
import { reviews } from "../../db/schema.js"
import { desc, eq } from "drizzle-orm"
import { requireAuthMiddleware } from "../middleware/identity"

export const listReviews = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(reviews).where(eq(reviews.approved, true)).orderBy(desc(reviews.createdAt))
})

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      customerName: z.string().min(1),
      rating: z.number().int().min(1).max(5),
      comment: z.string().min(1),
      serviceType: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const [row] = await db
      .insert(reviews)
      .values({ ...data, serviceType: data.serviceType || null })
      .returning()
    return row
  })

export const listAllReviewsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt))
  })
