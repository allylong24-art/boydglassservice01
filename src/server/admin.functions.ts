import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "../../db/index.js"
import { pricingConfig } from "../../db/schema.js"
import { eq } from "drizzle-orm"
import { requireAuthMiddleware } from "../middleware/identity"

const DEFAULT_PRICING_ROWS = [
  { key: "service_call_fee", label: "Service Call Fee", value: "49", unit: "flat", category: "fees" },
  { key: "tax_rate_percent", label: "Sales Tax Rate (%)", value: "7", unit: "percent", category: "fees" },
  { key: "window_labor_standard", label: "Window: Standard Install (per unit)", value: "45", unit: "per_unit", category: "labor" },
  { key: "window_labor_custom", label: "Window: Custom Frame Fitting (per unit)", value: "85", unit: "per_unit", category: "labor" },
  { key: "shower_labor_standard", label: "Shower: Standard Install (per unit)", value: "120", unit: "per_unit", category: "labor" },
  { key: "shower_labor_frameless", label: "Shower: Frameless Install (per unit)", value: "220", unit: "per_unit", category: "labor" },
  { key: "commercial_labor_standard", label: "Commercial: Standard Install (per unit)", value: "150", unit: "per_unit", category: "labor" },
  { key: "commercial_labor_structural", label: "Commercial: Structural Install (per unit)", value: "320", unit: "per_unit", category: "labor" },
]

export const listPricingConfig = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const existing = await db.select().from(pricingConfig)
    if (existing.length === 0) {
      await db.insert(pricingConfig).values(DEFAULT_PRICING_ROWS)
      return db.select().from(pricingConfig)
    }
    return existing
  })

export const updatePricingConfig = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.number(), value: z.number() }))
  .handler(async ({ data }) => {
    const [row] = await db
      .update(pricingConfig)
      .set({ value: String(data.value), updatedAt: new Date() })
      .where(eq(pricingConfig.id, data.id))
      .returning()
    return row
  })

export const exportCustomerData = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const { estimates } = await import("../../db/schema.js")
    const { appointments } = await import("../../db/schema.js")
    const estimateRows = await db.select().from(estimates)
    const appointmentRows = await db.select().from(appointments)
    return { estimates: estimateRows, appointments: appointmentRows }
  })
