import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useServerFn } from "@tanstack/react-start"
import { PageHero } from "../components/PageHero"
import {
  ADDITIONAL_SERVICES,
  AUTO_GLASS_ADDONS,
  AUTO_GLASS_PARTS,
  AUTO_INSTALL_OPTIONS,
  GLASS_TYPES,
  LABOR_OPTIONS,
  SERVICE_LABELS,
  calculateEstimate,
  getAutoPartLabel,
  getGlassTypeLabels,
  getLaborOptionLabels,
  type ServiceType,
} from "../lib/pricing"
import { submitEstimate } from "../server/estimates.functions"
import { generateEstimatePdf } from "../lib/generateEstimatePdf"
import { Printer, Mail, Download, Save, Calculator } from "lucide-react"
import { EMPTY_VEHICLE, VehiclePicker, formatVehicle, isVehicleComplete, type Vehicle } from "../components/VehiclePicker"

export const Route = createFileRoute("/estimate")({
  component: EstimatePage,
})

const SERVICE_TYPES: ServiceType[] = ["window", "shower", "commercial", "auto"]

function EstimatePage() {
  const submitEstimateFn = useServerFn(submitEstimate)

  const [serviceType, setServiceType] = useState<ServiceType>("window")
  const [width, setWidth] = useState(36)
  const [height, setHeight] = useState(48)
  const [quantity, setQuantity] = useState(1)
  const [glassTypeId, setGlassTypeId] = useState(GLASS_TYPES.window[0].id)
  const [laborOptionId, setLaborOptionId] = useState(LABOR_OPTIONS.window[0].id)
  const [glassTypeIds, setGlassTypeIds] = useState<string[]>([GLASS_TYPES.window[0].id])
  const [laborOptionIds, setLaborOptionIds] = useState<string[]>([LABOR_OPTIONS.window[0].id])
  const [additionalServiceIds, setAdditionalServiceIds] = useState<string[]>([])
  const [vehicle, setVehicle] = useState<Vehicle>(EMPTY_VEHICLE)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function selectService(type: ServiceType) {
    setServiceType(type)
    if (type === "auto") {
      setGlassTypeId(AUTO_GLASS_PARTS[0].id)
      setLaborOptionId(AUTO_INSTALL_OPTIONS[0].id)
    } else {
      setGlassTypeId(GLASS_TYPES[type][0].id)
      setLaborOptionId(LABOR_OPTIONS[type][0].id)
      setGlassTypeIds([GLASS_TYPES[type][0].id])
      setLaborOptionIds([LABOR_OPTIONS[type][0].id])
    }
    setAdditionalServiceIds([])
    setSaved(false)
  }

  // Keeps at least one option checked so the estimate always has a glass type and labor option.
  function toggleInList(setter: (fn: (prev: string[]) => string[]) => void, id: string) {
    setter((prev) => (prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]))
    setSaved(false)
  }

  function toggleAdditional(id: string) {
    setAdditionalServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    setSaved(false)
  }

  const isAuto = serviceType === "auto"
  const vehicleReady = isVehicleComplete(vehicle)
  // Auto glass prices only show once the customer has picked their exact vehicle.
  const showPrice = !isAuto || vehicleReady

  const input = useMemo(
    () => ({
      serviceType,
      width,
      height,
      quantity,
      glassTypeId,
      laborOptionId,
      ...(serviceType === "auto" ? {} : { glassTypeIds, laborOptionIds }),
      additionalServiceIds,
      vehicle:
        serviceType === "auto" && isVehicleComplete(vehicle)
          ? { year: vehicle.year, make: vehicle.make, model: vehicle.model }
          : undefined,
    }),
    [serviceType, width, height, quantity, glassTypeId, laborOptionId, glassTypeIds, laborOptionIds, additionalServiceIds, vehicle]
  )

  const breakdown = useMemo(() => calculateEstimate(input), [input])

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      await submitEstimateFn({
        data: { ...input, customerName, customerEmail, customerPhone },
      })
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong saving your estimate.")
    } finally {
      setSaving(false)
    }
  }

  function handlePrint() {
    const doc = generateEstimatePdf(input, breakdown, { name: customerName, email: customerEmail, phone: customerPhone })
    doc.autoPrint()
    window.open(doc.output("bloburl"), "_blank")
  }

  function handleDownload() {
    const doc = generateEstimatePdf(input, breakdown, { name: customerName, email: customerEmail, phone: customerPhone })
    doc.save(`boyd-glass-estimate-${Date.now()}.pdf`)
  }

  function handleEmail() {
    const subject = encodeURIComponent("My Boyd Glass Service Estimate")
    const details = isAuto
      ? `Vehicle: ${formatVehicle(vehicle)}\nGlass: ${getAutoPartLabel(glassTypeId)}, Qty: ${quantity}`
      : `Dimensions: ${width}" x ${height}", Qty: ${quantity}\nGlass: ${getGlassTypeLabels(serviceType, glassTypeIds).join(", ")}\nLabor: ${getLaborOptionLabels(serviceType, laborOptionIds).join(", ")}`
    const body = encodeURIComponent(
      `Service: ${SERVICE_LABELS[serviceType]}\n${details}\n\nMaterials: $${breakdown.materialsCost.toFixed(2)}\nLabor: $${breakdown.laborCost.toFixed(2)}\nAdditional: $${breakdown.additionalCost.toFixed(2)}\nFees: $${breakdown.feesCost.toFixed(2)}\nTax: $${breakdown.taxCost.toFixed(2)}\n\nEstimated Total: $${breakdown.totalCost.toFixed(2)}\n\n${isAuto ? "Final price confirmed after a VIN check." : "Final price confirmed after on-site measurement."}`
    )
    window.location.href = `mailto:${customerEmail || ""}?subject=${subject}&body=${body}`
  }

  return (
    <div>
      <PageHero title="Instant Estimate Calculator" subtitle="Get a ballpark price in seconds. Final pricing confirmed after an on-site measurement." compact />

      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">1. Choose a Service</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => selectService(type)}
                    className={`rounded-lg border p-4 text-left text-sm font-medium transition-colors ${
                      serviceType === type
                        ? "border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600"
                        : "border-slate-200 text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {SERVICE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {serviceType === "auto" ? (
              <>
                <div>
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">2. Your Vehicle</h2>
                  <VehiclePicker
                    value={vehicle}
                    onChange={(v) => {
                      setVehicle(v)
                      setSaved(false)
                    }}
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">3. What Needs Fixing?</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {AUTO_GLASS_PARTS.map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between rounded-lg border p-3 text-sm cursor-pointer ${
                          glassTypeId === p.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="autoPart"
                            checked={glassTypeId === p.id}
                            onChange={() => setGlassTypeId(p.id)}
                            className="accent-blue-600"
                          />
                          {p.label}
                        </span>
                        <span className="text-slate-500 text-xs">from ${p.partPrice + p.laborPrice}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 w-32">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">4. Where Should We Do It?</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {AUTO_INSTALL_OPTIONS.map((o) => (
                      <label
                        key={o.id}
                        className={`flex items-center justify-between rounded-lg border p-3 text-sm cursor-pointer ${
                          laborOptionId === o.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="autoInstall"
                            checked={laborOptionId === o.id}
                            onChange={() => setLaborOptionId(o.id)}
                            className="accent-blue-600"
                          />
                          {o.label}
                        </span>
                        <span className="text-slate-500 text-xs">{o.fee ? `+$${o.fee}` : "Included"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">5. Vehicle Features &amp; Extras</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {AUTO_GLASS_ADDONS.map((a) => (
                      <label
                        key={a.id}
                        className={`flex items-center justify-between rounded-lg border p-3 text-sm cursor-pointer ${
                          additionalServiceIds.includes(a.id) ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={additionalServiceIds.includes(a.id)}
                            onChange={() => toggleAdditional(a.id)}
                            className="accent-blue-600"
                          />
                          {a.label}
                        </span>
                        <span className="text-slate-500 text-xs whitespace-nowrap pl-2">
                          ${a.flatFee}
                          {a.perUnit ? "/piece" : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">2. Measurements &amp; Quantity</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Width (inches)</label>
                  <input
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Height (inches)</label>
                  <input
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">3. Glass Type <span className="normal-case font-normal text-slate-500">(select all that apply)</span></h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {GLASS_TYPES[serviceType].map((g) => (
                  <label
                    key={g.id}
                    className={`flex items-center justify-between rounded-lg border p-3 text-sm cursor-pointer ${
                      glassTypeIds.includes(g.id) ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={glassTypeIds.includes(g.id)}
                        onChange={() => toggleInList(setGlassTypeIds, g.id)}
                        className="accent-blue-600"
                      />
                      {g.label}
                    </span>
                    <span className="text-slate-500 text-xs">${g.pricePerSqFt}/sq ft</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">4. Labor Options <span className="normal-case font-normal text-slate-500">(select all that apply)</span></h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {LABOR_OPTIONS[serviceType].map((l) => (
                  <label
                    key={l.id}
                    className={`flex items-center justify-between rounded-lg border p-3 text-sm cursor-pointer ${
                      laborOptionIds.includes(l.id) ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={laborOptionIds.includes(l.id)}
                        onChange={() => toggleInList(setLaborOptionIds, l.id)}
                        className="accent-blue-600"
                      />
                      {l.label}
                    </span>
                    <span className="text-slate-500 text-xs">${l.ratePerUnit}/unit</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">5. Additional Services</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {ADDITIONAL_SERVICES.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-center justify-between rounded-lg border p-3 text-sm cursor-pointer ${
                      additionalServiceIds.includes(a.id) ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={additionalServiceIds.includes(a.id)}
                        onChange={() => toggleAdditional(a.id)}
                        className="accent-blue-600"
                      />
                      {a.label}
                    </span>
                    <span className="text-slate-500 text-xs">
                      ${a.flatFee}
                      {a.perUnit ? "/unit" : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>

              </>
            )}

            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">6. Contact Info (optional, for saving/emailing)</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <input
                  placeholder="Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <input
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 self-start">
            <div className="rounded-xl border border-slate-200 shadow-sm p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-blue-700" />
                <h3 className="font-semibold text-slate-800">Estimate Summary</h3>
              </div>
              <div className="text-xs text-slate-500 mb-4">
                {SERVICE_LABELS[serviceType]} &middot;{" "}
                {isAuto ? (vehicleReady ? `${formatVehicle(vehicle)} · ${getAutoPartLabel(glassTypeId)}` : "No vehicle selected") : `${breakdown.totalSqFt} sq ft total`}
              </div>

              {showPrice ? (
              <>
              <dl className="space-y-2 text-sm">
                <Row label={isAuto ? "Glass" : "Materials"} value={breakdown.materialsCost} />
                <Row label="Labor" value={breakdown.laborCost} />
                <Row label={isAuto ? "Service & Extras" : "Additional Services"} value={breakdown.additionalCost} />
                {!isAuto && <Row label="Service Call Fee" value={breakdown.feesCost} />}
                <Row label="Tax (7%)" value={breakdown.taxCost} />
              </dl>

              <div className="border-t border-slate-200 my-4" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Estimated Total</span>
                <span className="text-2xl font-bold text-blue-700">${breakdown.totalCost.toFixed(2)}</span>
              </div>

              <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                {isAuto
                  ? "This is an automated estimate. Final pricing will be confirmed after a VIN check, since sensors, cameras, and heated glass vary by trim."
                  : "This is an automated estimate. Final pricing will be confirmed after an on-site measurement and inspection."}
              </p>
              </>
              ) : (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  Pick your vehicle's year, make, and model to see your price instantly.
                </p>
              )}

              {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
              {saved && <p className="mt-3 text-xs text-green-600">Estimate saved! We'll follow up if you provided contact info.</p>}

              <div className="grid grid-cols-2 gap-2 mt-5">
                <button onClick={handleSave} disabled={saving || !showPrice} className="flex items-center justify-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                  <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={handleDownload} disabled={!showPrice} className="flex items-center disabled:opacity-60 justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
                <button onClick={handlePrint} disabled={!showPrice} className="flex items-center disabled:opacity-60 justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button onClick={handleEmail} disabled={!showPrice} className="flex items-center disabled:opacity-60 justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-700">${value.toFixed(2)}</dd>
    </div>
  )
}
