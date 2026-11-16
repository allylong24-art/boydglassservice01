export type ServiceType = "window" | "shower" | "commercial"

export const GLASS_TYPES: Record<ServiceType, { id: string; label: string; pricePerSqFt: number }[]> = {
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

export const LABOR_OPTIONS: Record<ServiceType, { id: string; label: string; ratePerUnit: number }[]> = {
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

export const TAX_RATE = 0.07
export const SERVICE_CALL_FEE = 49

export interface EstimateInput {
  serviceType: ServiceType
  width: number
  height: number
  quantity: number
  glassTypeId: string
  laborOptionId: string
  additionalServiceIds: string[]
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
  const sqFtPerUnit = (width * height) / 144
  const totalSqFt = sqFtPerUnit * quantity

  const glass = GLASS_TYPES[serviceType].find((g) => g.id === glassTypeId) ?? GLASS_TYPES[serviceType][0]
  const labor = LABOR_OPTIONS[serviceType].find((l) => l.id === laborOptionId) ?? LABOR_OPTIONS[serviceType][0]

  const materialsCost = totalSqFt * glass.pricePerSqFt
  const laborCost = labor.ratePerUnit * quantity

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

function round(n: number) {
  return Math.round(n * 100) / 100
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  window: "Window Glass Replacement",
  shower: "Shower Door Installation",
  commercial: "Commercial / Storefront Glass",
}
