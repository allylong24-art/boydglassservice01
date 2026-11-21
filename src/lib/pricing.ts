export type ServiceType = "window" | "shower" | "commercial" | "auto"
/** Services priced by measured square footage (everything except auto glass). */
export type AreaServiceType = Exclude<ServiceType, "auto">

export const GLASS_TYPES: Record<AreaServiceType, { id: string; label: string; pricePerSqFt: number }[]> = {
  window: [
    { id: "single-pane", label: "Single Pane", pricePerSqFt: 12 },
    { id: "double-pane", label: "Double Pane (Insulated)", pricePerSqFt: 22 },
    { id: "low-e", label: "Low-E Energy Efficient", pricePerSqFt: 28 },
    { id: "tempered", label: "Tempered Safety Glass", pricePerSqFt: 26 },
  ],
  shower: [
    { id: "clear-3-8", label: "Clear Tempered 3/8\"", pricePerSqFt: 34 },
    { id: "clear-1-2", label: "Clear Tempered 1/2\"", pricePerSqFt: 42 },
    { id: "frosted", label: "Frosted / Etched", pricePerSqFt: 46 },
    { id: "tinted", label: "Tinted / Bronze", pricePerSqFt: 44 },
  ],
  commercial: [
    { id: "tempered-store", label: "Tempered Storefront Glass", pricePerSqFt: 30 },
    { id: "laminated", label: "Laminated Safety Glass", pricePerSqFt: 38 },
    { id: "insulated-comm", label: "Insulated Commercial Unit", pricePerSqFt: 34 },
    { id: "bullet-resistant", label: "Impact / Security Glass", pricePerSqFt: 65 },
  ],
}

export const LABOR_OPTIONS: Record<AreaServiceType, { id: string; label: string; ratePerUnit: number }[]> = {
  window: [
    { id: "standard", label: "Standard Installation", ratePerUnit: 45 },
    { id: "custom-frame", label: "Custom Frame Fitting", ratePerUnit: 85 },
  ],
  shower: [
    { id: "standard", label: "Standard Enclosure Install", ratePerUnit: 120 },
    { id: "frameless", label: "Frameless Custom Install", ratePerUnit: 220 },
  ],
  commercial: [
    { id: "standard", label: "Standard Storefront Install", ratePerUnit: 150 },
    { id: "structural", label: "Structural / Curtain Wall Install", ratePerUnit: 320 },
  ],
}

export const ADDITIONAL_SERVICES = [
  { id: "old-glass-removal", label: "Old Glass Removal & Disposal", flatFee: 35, perUnit: true },
  { id: "emergency", label: "Emergency / Same-Day Service", flatFee: 150, perUnit: false },
  { id: "hardware-upgrade", label: "New Hardware / Handles", flatFee: 60, perUnit: true },
  { id: "site-cleanup", label: "Job Site Cleanup", flatFee: 40, perUnit: false },
]

// PLACEHOLDER auto glass prices — replace with real rates (e.g. set against local competitor quotes).
// Auto glass is priced per piece of glass for the selected vehicle, not by square footage.
export const AUTO_GLASS_PARTS = [
  { id: "windshield", label: "Windshield Replacement", partPrice: 260, laborPrice: 110 },
  { id: "side-window", label: "Side / Door Window", partPrice: 140, laborPrice: 85 },
  { id: "back-glass", label: "Back Glass (Rear Window)", partPrice: 280, laborPrice: 120 },
  { id: "vent-quarter", label: "Vent / Quarter Glass", partPrice: 110, laborPrice: 75 },
  { id: "chip-repair", label: "Windshield Chip Repair", partPrice: 0, laborPrice: 79 },
]

export const AUTO_INSTALL_OPTIONS = [
  { id: "in-shop", label: "In-Shop Service", fee: 0 },
  { id: "mobile", label: "Mobile Service (we come to you)", fee: 35 },
]

export const AUTO_GLASS_ADDONS = [
  { id: "adas-calibration", label: "ADAS Camera Recalibration (lane assist, auto-braking)", flatFee: 249, perUnit: false },
  { id: "rain-sensor", label: "Rain Sensor / Heated Glass", flatFee: 75, perUnit: true },
  { id: "oem-glass", label: "OEM (Dealer-Brand) Glass Upgrade", flatFee: 150, perUnit: true },
  { id: "molding", label: "New Moldings / Clips", flatFee: 40, perUnit: true },
]

export const TAX_RATE = 0.07
export const SERVICE_CALL_FEE = 49

export interface EstimateInput {
  serviceType: ServiceType
  width: number
  height: number
  quantity: number
  glassTypeId: string
  laborOptionId: string
  /** Multiple glass types (area services). When present, overrides glassTypeId. */
  glassTypeIds?: string[]
  /** Multiple labor options (area services). When present, overrides laborOptionId. */
  laborOptionIds?: string[]
  additionalServiceIds: string[]
  /** Only used for auto glass estimates. */
  vehicle?: { year: number; make: string; model: string }
}

export interface EstimateBreakdown {
  sqFtPerUnit: number
  totalSqFt: number
  materialsCost: number
  laborCost: number
  additionalCost: number
  feesCost: number
  subtotal: number
  taxCost: number
  totalCost: number
}

export function calculateEstimate(input: EstimateInput): EstimateBreakdown {
  const { serviceType, width, height, quantity, glassTypeId, laborOptionId, additionalServiceIds } = input
  if (serviceType === "auto") return calculateAutoEstimate(input)

  const sqFtPerUnit = (width * height) / 144
  const totalSqFt = sqFtPerUnit * quantity

  const glassIds = input.glassTypeIds?.length ? input.glassTypeIds : [glassTypeId]
  const laborIds = input.laborOptionIds?.length ? input.laborOptionIds : [laborOptionId]
  const glasses = GLASS_TYPES[serviceType].filter((g) => glassIds.includes(g.id))
  const labors = LABOR_OPTIONS[serviceType].filter((l) => laborIds.includes(l.id))
  if (glasses.length === 0) glasses.push(GLASS_TYPES[serviceType][0])
  if (labors.length === 0) labors.push(LABOR_OPTIONS[serviceType][0])

  const materialsCost = totalSqFt * glasses.reduce((sum, g) => sum + g.pricePerSqFt, 0)
  const laborCost = labors.reduce((sum, l) => sum + l.ratePerUnit, 0) * quantity

  let additionalCost = 0
  for (const id of additionalServiceIds) {
    const svc = ADDITIONAL_SERVICES.find((s) => s.id === id)
    if (!svc) continue
    additionalCost += svc.perUnit ? svc.flatFee * quantity : svc.flatFee
  }

  const feesCost = SERVICE_CALL_FEE
  const subtotal = materialsCost + laborCost + additionalCost + feesCost
  const taxCost = subtotal * TAX_RATE
  const totalCost = subtotal + taxCost

  return {
    sqFtPerUnit: round(sqFtPerUnit),
    totalSqFt: round(totalSqFt),
    materialsCost: round(materialsCost),
    laborCost: round(laborCost),
    additionalCost: round(additionalCost),
    feesCost: round(feesCost),
    subtotal: round(subtotal),
    taxCost: round(taxCost),
    totalCost: round(totalCost),
  }
}

function calculateAutoEstimate(input: EstimateInput): EstimateBreakdown {
  const { quantity, glassTypeId, laborOptionId, additionalServiceIds } = input
  const part = AUTO_GLASS_PARTS.find((p) => p.id === glassTypeId) ?? AUTO_GLASS_PARTS[0]
  const install = AUTO_INSTALL_OPTIONS.find((o) => o.id === laborOptionId) ?? AUTO_INSTALL_OPTIONS[0]

  const materialsCost = part.partPrice * quantity
  const laborCost = part.laborPrice * quantity
  let additionalCost = install.fee
  for (const id of additionalServiceIds) {
    const addon = AUTO_GLASS_ADDONS.find((a) => a.id === id)
    if (!addon) continue
    additionalCost += addon.perUnit ? addon.flatFee * quantity : addon.flatFee
  }

  const feesCost = 0
  const subtotal = materialsCost + laborCost + additionalCost + feesCost
  const taxCost = subtotal * TAX_RATE
  return {
    sqFtPerUnit: 0,
    totalSqFt: 0,
    materialsCost: round(materialsCost),
    laborCost: round(laborCost),
    additionalCost: round(additionalCost),
    feesCost: round(feesCost),
    subtotal: round(subtotal),
    taxCost: round(taxCost),
    totalCost: round(subtotal + taxCost),
  }
}

export function getGlassTypeLabels(serviceType: AreaServiceType, ids: string[]) {
  return GLASS_TYPES[serviceType].filter((g) => ids.includes(g.id)).map((g) => g.label)
}

export function getLaborOptionLabels(serviceType: AreaServiceType, ids: string[]) {
  return LABOR_OPTIONS[serviceType].filter((l) => ids.includes(l.id)).map((l) => l.label)
}

export function getAutoPartLabel(id: string) {
  return (AUTO_GLASS_PARTS.find((p) => p.id === id) ?? AUTO_GLASS_PARTS[0]).label
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  window: "Window Glass Replacement",
  shower: "Shower Door Installation",
  commercial: "Commercial / Storefront Glass",
  auto: "Auto Glass",
}
