import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { asc, eq, inArray } from "drizzle-orm"
import { db } from "../../db/index.js"
import { autoGlassParts, estimates, pricingConfig } from "../../db/schema.js"
import { requireAuthMiddleware } from "../middleware/identity"
import {
  AUTO_SETTING_DEFAULTS,
  DEFAULT_TAX_RATE_PERCENT,
  calculateAutoEstimate,
  type AutoSettings,
  type PublicAutoPart,
} from "../lib/autoGlass"

async function loadAutoSettings(): Promise<AutoSettings> {
  const keys = [...AUTO_SETTING_DEFAULTS.map((d) => d.key), "tax_rate_percent"]
  const rows = await db.select().from(pricingConfig).where(inArray(pricingConfig.key, keys))
  const value = (key: string, fallback: number) => {
    const row = rows.find((r) => r.key === key)
    const n = row ? Number(row.value) : NaN
    return Number.isFinite(n) ? n : fallback
  }
  const def = (key: string) => Number(AUTO_SETTING_DEFAULTS.find((d) => d.key === key)!.value)
  return {
    percentOfList: value("auto_glass_percent_of_list", def("auto_glass_percent_of_list")),
    laborRate: value("auto_labor_rate", def("auto_labor_rate")),
    kitFee: value("auto_kit_fee", def("auto_kit_fee")),
    calibrationFee: value("auto_calibration_fee", def("auto_calibration_fee")),
    mobileFee: value("auto_mobile_fee", def("auto_mobile_fee")),
    taxRatePercent: value("tax_rate_percent", DEFAULT_TAX_RATE_PERCENT),
  }
}

async function loadActivePart(partId: number) {
  const [part] = await db.select().from(autoGlassParts).where(eq(autoGlassParts.id, partId))
  if (!part || !part.active) throw new Error("That glass part is no longer available. Please call us for a quote.")
  return part
}

function priceFor(part: typeof autoGlassParts.$inferSelect, settings: AutoSettings, mobileService: boolean) {
  return calculateAutoEstimate(
    { listPrice: Number(part.listPrice), laborHours: Number(part.laborHours), calibrationRequired: part.calibrationRequired },
    settings,
    { mobileService }
  )
}

// ---------- Public ----------

/** Vehicle/glass options for the customer estimator. Never includes NAGS list prices or labor hours. */
export const getAutoGlassCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select()
    .from(autoGlassParts)
    .where(eq(autoGlassParts.active, true))
    .orderBy(asc(autoGlassParts.make), asc(autoGlassParts.model), asc(autoGlassParts.position))
  const settings = await loadAutoSettings()
  const parts: PublicAutoPart[] = rows.map((r) => ({
    id: r.id,
    yearStart: r.yearStart,
    yearEnd: r.yearEnd,
    make: r.make,
    model: r.model,
    bodyStyle: r.bodyStyle,
    position: r.position,
    description: r.description,
    calibrationRequired: r.calibrationRequired,
  }))
  return { parts, mobileFee: settings.mobileFee, calibrationFee: settings.calibrationFee }
})

const QuoteSchema = z.object({
  partId: z.number().int().positive(),
  mobileService: z.boolean(),
})

export const quoteAutoGlass = createServerFn({ method: "POST" })
  .inputValidator(QuoteSchema)
  .handler(async ({ data }) => {
    const part = await loadActivePart(data.partId)
    const settings = await loadAutoSettings()
    return priceFor(part, settings, data.mobileService)
  })

export const submitAutoEstimate = createServerFn({ method: "POST" })
  .inputValidator(
    QuoteSchema.extend({
      vehicleYear: z.number().int().min(1900).max(2100),
      customerName: z.string().optional(),
      customerEmail: z.string().email().optional().or(z.literal("")),
      customerPhone: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const part = await loadActivePart(data.partId)
    const settings = await loadAutoSettings()
    const breakdown = priceFor(part, settings, data.mobileService)
    const [row] = await db
      .insert(estimates)
      .values({
        serviceType: "auto",
        customerName: data.customerName || null,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        inputData: {
          vehicle: `${data.vehicleYear} ${part.make} ${part.model}${part.bodyStyle ? ` ${part.bodyStyle}` : ""}`,
          vehicleYear: data.vehicleYear,
          make: part.make,
          model: part.model,
          bodyStyle: part.bodyStyle,
          position: part.position,
          description: part.description,
          nagsNumber: part.nagsNumber,
          partId: part.id,
          mobileService: data.mobileService,
          calibrationRequired: part.calibrationRequired,
          breakdown,
        },
        materialsCost: String(breakdown.glassCost),
        laborCost: String(breakdown.laborCost),
        feesCost: String(breakdown.feesCost),
        taxCost: String(breakdown.taxCost),
        totalCost: String(breakdown.totalCost),
      })
      .returning({ id: estimates.id })
    return { id: row.id, breakdown }
  })

// ---------- Admin ----------

const PartSchema = z.object({
  nagsNumber: z.string().trim().min(1).max(40),
  yearStart: z.number().int().min(1900).max(2100),
  yearEnd: z.number().int().min(1900).max(2100),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  bodyStyle: z.string().trim().max(80).nullish(),
  position: z.string().trim().min(1).max(60),
  description: z.string().trim().max(300).nullish(),
  listPrice: z.number().min(0),
  laborHours: z.number().min(0).max(100),
  calibrationRequired: z.boolean(),
  active: z.boolean().optional(),
}).refine((p) => p.yearEnd >= p.yearStart, { message: "End year must be on or after start year" })

function toRow(p: z.infer<typeof PartSchema>) {
  return {
    nagsNumber: p.nagsNumber.toUpperCase(),
    yearStart: p.yearStart,
    yearEnd: p.yearEnd,
    make: p.make,
    model: p.model,
    bodyStyle: p.bodyStyle || null,
    position: p.position,
    description: p.description || null,
    listPrice: String(p.listPrice),
    laborHours: String(p.laborHours),
    calibrationRequired: p.calibrationRequired,
    active: p.active ?? true,
  }
}

export const listAutoParts = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db
      .select()
      .from(autoGlassParts)
      .orderBy(asc(autoGlassParts.make), asc(autoGlassParts.model), asc(autoGlassParts.yearStart), asc(autoGlassParts.position))
  })

export const createAutoPart = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(PartSchema)
  .handler(async ({ data }) => {
    const [row] = await db.insert(autoGlassParts).values(toRow(data)).returning()
    return row
  })

export const updateAutoPart = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.number().int(), part: PartSchema }))
  .handler(async ({ data }) => {
    const [row] = await db
      .update(autoGlassParts)
      .set({ ...toRow(data.part), updatedAt: new Date() })
      .where(eq(autoGlassParts.id, data.id))
      .returning()
    return row
  })

export const deleteAutoPart = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    await db.delete(autoGlassParts).where(eq(autoGlassParts.id, data.id))
    return { ok: true }
  })

export const importAutoParts = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ parts: z.array(PartSchema).min(1).max(5000) }))
  .handler(async ({ data }) => {
    const rows = data.parts.map(toRow)
    for (let i = 0; i < rows.length; i += 500) {
      await db.insert(autoGlassParts).values(rows.slice(i, i + 500))
    }
    return { inserted: rows.length }
  })
