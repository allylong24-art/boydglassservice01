// Automotive glass pricing (NAGS-based).
// Customer price = (NAGS list × glass % of list) + (NAGS labor hours × hourly rate) + kit fee
//                  + ADAS calibration (when the part requires it) + optional mobile service, then tax.
// The rates live in the pricing_config table (category "auto") and are editable in the admin Pricing tab.

export const AUTO_GLASS_POSITIONS = [
  "Windshield",
  "Back Glass",
  "Driver Front Door",
  "Passenger Front Door",
  "Driver Rear Door",
  "Passenger Rear Door",
  "Driver Quarter / Vent",
  "Passenger Quarter / Vent",
  "Sunroof / Roof Glass",
  "Other",
] as const

export const AUTO_SETTING_DEFAULTS: { key: string; label: string; value: string; unit: string; category: string }[] = [
  { key: "auto_glass_percent_of_list", label: "Auto: Glass Price (% of NAGS List)", value: "70", unit: "percent", category: "auto" },
  { key: "auto_labor_rate", label: "Auto: Labor Rate (per NAGS hour)", value: "50", unit: "per_hour", category: "auto" },
  { key: "auto_kit_fee", label: "Auto: Kit Fee (urethane, molding, clips)", value: "25", unit: "flat", category: "auto" },
  { key: "auto_calibration_fee", label: "Auto: ADAS Camera Calibration", value: "250", unit: "flat", category: "auto" },
  { key: "auto_mobile_fee", label: "Auto: Mobile Service Fee", value: "35", unit: "flat", category: "auto" },
]

export const DEFAULT_TAX_RATE_PERCENT = 7

export interface AutoSettings {
  percentOfList: number
  laborRate: number
  kitFee: number
  calibrationFee: number
  mobileFee: number
  taxRatePercent: number
}

export interface AutoEstimateBreakdown {
  glassCost: number
  laborCost: number
  kitFee: number
  calibrationFee: number
  mobileFee: number
  feesCost: number
  subtotal: number
  taxRatePercent: number
  taxCost: number
  totalCost: number
}

export function calculateAutoEstimate(
  part: { listPrice: number; laborHours: number; calibrationRequired: boolean },
  settings: AutoSettings,
  options: { mobileService: boolean }
): AutoEstimateBreakdown {
  const glassCost = part.listPrice * (settings.percentOfList / 100)
  const laborCost = part.laborHours * settings.laborRate
  const kitFee = settings.kitFee
  const calibrationFee = part.calibrationRequired ? settings.calibrationFee : 0
  const mobileFee = options.mobileService ? settings.mobileFee : 0
  const feesCost = kitFee + calibrationFee + mobileFee
  const subtotal = glassCost + laborCost + feesCost
  const taxCost = subtotal * (settings.taxRatePercent / 100)
  return {
    glassCost: round(glassCost),
    laborCost: round(laborCost),
    kitFee: round(kitFee),
    calibrationFee: round(calibrationFee),
    mobileFee: round(mobileFee),
    feesCost: round(feesCost),
    subtotal: round(subtotal),
    taxRatePercent: settings.taxRatePercent,
    taxCost: round(taxCost),
    totalCost: round(subtotal + taxCost),
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

/** Public (customer-safe) view of a part — no NAGS list price or labor hours. */
export interface PublicAutoPart {
  id: number
  yearStart: number
  yearEnd: number
  make: string
  model: string
  bodyStyle: string | null
  position: string
  description: string | null
  calibrationRequired: boolean
}

export interface AutoPartInput {
  nagsNumber: string
  yearStart: number
  yearEnd: number
  make: string
  model: string
  bodyStyle?: string | null
  position: string
  description?: string | null
  listPrice: number
  laborHours: number
  calibrationRequired: boolean
  active?: boolean
}

export const AUTO_CSV_HEADERS = [
  "nags_number",
  "year_start",
  "year_end",
  "make",
  "model",
  "body_style",
  "position",
  "description",
  "list_price",
  "labor_hours",
  "calibration_required",
] as const

/** Parses a CSV (with header row) exported/typed from NAGS data into part inputs. */
export function parseAutoPartsCsv(text: string): { parts: AutoPartInput[]; errors: string[] } {
  const rows = parseCsvRows(text).filter((r) => r.some((c) => c.trim() !== ""))
  if (rows.length === 0) return { parts: [], errors: ["The file is empty."] }
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"))
  const idx = (name: string) => header.indexOf(name)
  const missing = ["nags_number", "year_start", "make", "model", "position", "list_price", "labor_hours"].filter((h) => idx(h) === -1)
  if (missing.length) return { parts: [], errors: [`Missing column(s): ${missing.join(", ")}`] }

  const parts: AutoPartInput[] = []
  const errors: string[] = []
  rows.slice(1).forEach((r, i) => {
    const get = (name: string) => (idx(name) === -1 ? "" : (r[idx(name)] ?? "").trim())
    const line = i + 2
    const yearStart = parseInt(get("year_start"), 10)
    const yearEnd = get("year_end") ? parseInt(get("year_end"), 10) : yearStart
    const listPrice = Number(get("list_price").replace(/[$,]/g, ""))
    const laborHours = Number(get("labor_hours"))
    if (!get("nags_number") || !get("make") || !get("model") || !get("position")) {
      errors.push(`Row ${line}: nags_number, make, model and position are required.`)
      return
    }
    if (!Number.isFinite(yearStart) || !Number.isFinite(yearEnd) || yearEnd < yearStart) {
      errors.push(`Row ${line}: invalid year range.`)
      return
    }
    if (!Number.isFinite(listPrice) || listPrice < 0 || !Number.isFinite(laborHours) || laborHours < 0) {
      errors.push(`Row ${line}: invalid list_price or labor_hours.`)
      return
    }
    parts.push({
      nagsNumber: get("nags_number").toUpperCase(),
      yearStart,
      yearEnd,
      make: get("make"),
      model: get("model"),
      bodyStyle: get("body_style") || null,
      position: get("position"),
      description: get("description") || null,
      listPrice,
      laborHours,
      calibrationRequired: /^(y|yes|true|1|x)$/i.test(get("calibration_required")),
    })
  })
  return { parts, errors }
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") {
      row.push(cell)
      cell = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else cell += ch
  }
  if (cell !== "" || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}
