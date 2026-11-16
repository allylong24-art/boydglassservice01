import { jsPDF } from "jspdf"
import type { EstimateBreakdown, EstimateInput } from "./pricing"
import { SERVICE_LABELS } from "./pricing"

export function generateEstimatePdf(input: EstimateInput, breakdown: EstimateBreakdown, customer?: { name?: string; email?: string; phone?: string }) {
  const doc = new jsPDF()
  const margin = 20
  let y = margin

  doc.setFontSize(18)
  doc.setTextColor(29, 78, 216)
  doc.text("Boyd Glass Service", margin, y)
  y += 7
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text("Instant Estimate", margin, y)
  y += 12

  doc.setDrawColor(220)
  doc.line(margin, y, 190, y)
  y += 10

  doc.setFontSize(12)
  doc.setTextColor(20)
  doc.text(`Service: ${SERVICE_LABELS[input.serviceType]}`, margin, y)
  y += 8
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, y)
  y += 8

  if (customer?.name) {
    doc.text(`Customer: ${customer.name}`, margin, y)
    y += 8
  }
  if (customer?.email) {
    doc.text(`Email: ${customer.email}`, margin, y)
    y += 8
  }
  if (customer?.phone) {
    doc.text(`Phone: ${customer.phone}`, margin, y)
    y += 8
  }

  y += 4
  doc.setFontSize(13)
  doc.setTextColor(29, 78, 216)
  doc.text("Job Details", margin, y)
  y += 8
  doc.setFontSize(11)
  doc.setTextColor(20)
  doc.text(`Dimensions: ${input.width}" x ${input.height}" per unit`, margin, y)
  y += 7
  doc.text(`Quantity: ${input.quantity}`, margin, y)
  y += 7
  doc.text(`Total area: ${breakdown.totalSqFt} sq ft`, margin, y)
  y += 12

  doc.setFontSize(13)
  doc.setTextColor(29, 78, 216)
  doc.text("Cost Breakdown", margin, y)
  y += 8
  doc.setFontSize(11)
  doc.setTextColor(20)

  const rows: [string, number][] = [
    ["Materials", breakdown.materialsCost],
    ["Labor", breakdown.laborCost],
    ["Additional Services", breakdown.additionalCost],
    ["Service Call Fee", breakdown.feesCost],
    ["Tax", breakdown.taxCost],
  ]
  for (const [label, amount] of rows) {
    doc.text(label, margin, y)
    doc.text(`$${amount.toFixed(2)}`, 170, y, { align: "right" })
    y += 7
  }

  y += 3
  doc.setDrawColor(220)
  doc.line(margin, y, 190, y)
  y += 10

  doc.setFontSize(14)
  doc.setTextColor(29, 78, 216)
  doc.text("Estimated Total", margin, y)
  doc.text(`$${breakdown.totalCost.toFixed(2)}`, 170, y, { align: "right" })
  y += 16

  doc.setFontSize(9)
  doc.setTextColor(120)
  const disclaimer =
    "This is an automated estimate based on the information provided. Final pricing will be confirmed after an on-site measurement and inspection. Prices are subject to change based on actual site conditions, material availability, and access requirements."
  const lines = doc.splitTextToSize(disclaimer, 170)
  doc.text(lines, margin, y)

  return doc
}
