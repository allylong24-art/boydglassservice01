import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "../../db/index.js"
import { estimates } from "../../db/schema.js"
import { desc } from "drizzle-orm"
import { calculateEstimate } from "../lib/pricing"
import { requireAuthMiddleware } from "../middleware/identity"

const EstimateInputSchema = z.object({
  serviceType: z.enum(["window", "shower", "commercial"]),
  width: z.number().positive(),
  height: z.number().positive(),
  quantity: z.number().int().positive(),
  glassTypeId: z.string(),
  laborOptionId: z.string(),
  additionalServiceIds: z.array(z.string()),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
})

export const submitEstimate = createServerFn({ method: "POST" })
  .inputValidator(EstimateInputSchema)
  .handler(async ({ data }) => {
    const breakdown = calculateEstimate(data)
    const [row] = await db
      .insert(estimates)
      .values({
        serviceType: data.serviceType,
        customerName: data.customerName || null,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        inputData: data,
        materialsCost: String(breakdown.materialsCost),
        laborCost: String(breakdown.laborCost),
        feesCost: String(breakdown.feesCost + breakdown.additionalCost),
        taxCost: String(breakdown.taxCost),
        totalCost: String(breakdown.totalCost),
      })
      .returning()
    return { estimate: row, breakdown }
  })

export const listEstimates = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.select().from(estimates).orderBy(desc(estimates.createdAt))
  })
