import { useEffect, useMemo, useState } from "react"
import { useServerFn } from "@tanstack/react-start"
import { Link } from "@tanstack/react-router"
import { Car, Download, Mail, Printer, Save, AlertTriangle } from "lucide-react"
import { getAutoGlassCatalog, quoteAutoGlass, submitAutoEstimate } from "../server/auto-glass.functions"
import type { AutoEstimateBreakdown, PublicAutoPart } from "../lib/autoGlass"
import { generateAutoEstimatePdf } from "../lib/generateEstimatePdf"

const selectClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"

const uniqueSorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b))

export function AutoGlassEstimator() {
  const catalogFn = useServerFn(getAutoGlassCatalog)
  const quoteFn = useServerFn(quoteAutoGlass)
  const submitFn = useServerFn(submitAutoEstimate)

  const [catalog, setCatalog] = useState<{ parts: PublicAutoPart[]; mobileFee: number; calibrationFee: number } | null>(null)
  const [loadError, setLoadError] = useState("")

  const [year, setYear] = useState<number | "">("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [position, setPosition] = useState("")
  const [partId, setPartId] = useState<number | null>(null)
  const [mobileService, setMobileService] = useState(false)

  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  const [quote, setQuote] = useState<AutoEstimateBreakdown | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    catalogFn()
      .then(setCatalog)
      .catch(() => setLoadError("We couldn't load the vehicle list. Please call us for an auto glass quote."))
  }, [])

  const parts = catalog?.parts ?? []

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const p of parts) for (let y = p.yearStart; y <= p.yearEnd; y++) set.add(y)
    return [...set].sort((a, b) => b - a)
  }, [parts])

  const forYear = useMemo(() => (year === "" ? [] : parts.filter((p) => p.yearStart <= year && p.yearEnd >= year)), [parts, year])
  const makes = useMemo(() => uniqueSorted(forYear.map((p) => p.make)), [forYear])
  const forMake = useMemo(() => forYear.filter((p) => p.make === make), [forYear, make])
  const models = useMemo(() => uniqueSorted(forMake.map((p) => p.model)), [forMake])
  const forModel = useMemo(() => forMake.filter((p) => p.model === model), [forMake, model])
  const positions = useMemo(() => uniqueSorted(forModel.map((p) => p.position)), [forModel])
  const options = useMemo(() => forModel.filter((p) => p.position === position), [forModel, position])
  const selectedPart = options.find((p) => p.id === partId) ?? null

  // Auto-select when only one glass option matches.
  useEffect(() => {
    if (options.length === 1) setPartId(options[0].id)
    else if (!options.some((p) => p.id === partId)) setPartId(null)
  }, [options])

  useEffect(() => {
    setSaved(false)
    setError("")
    if (!partId) {
      setQuote(null)
      return
    }
    let cancelled = false
    setQuoting(true)
    quoteFn({ data: { partId, mobileService } })
      .then((q) => !cancelled && setQuote(q))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Couldn't price that part."))
      .finally(() => !cancelled && setQuoting(false))
    return () => {
      cancelled = true
    }
  }, [partId, mobileService])

  const vehicleLabel = selectedPart
    ? `${year} ${selectedPart.make} ${selectedPart.model}${selectedPart.bodyStyle ? ` ${selectedPart.bodyStyle}` : ""}`
    : ""

  async function handleSave() {
    if (!partId || year === "") return
    setSaving(true)
    setError("")
    try {
      await submitFn({ data: { partId, mobileService, vehicleYear: year, customerName, customerEmail, customerPhone } })
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong saving your estimate.")
    } finally {
      setSaving(false)
    }
  }

  function pdf() {
    return generateAutoEstimatePdf(
      { vehicle: vehicleLabel, position: selectedPart!.position, description: selectedPart!.description, mobileService },
      quote!,
      { name: customerName, email: customerEmail, phone: customerPhone }
    )
  }

  function handlePrint() {
    const doc = pdf()
    doc.autoPrint()
    window.open(doc.output("bloburl"), "_blank")
  }

  function handleEmail() {
    if (!quote || !selectedPart) return
    const subject = encodeURIComponent("My Boyd Glass Auto Glass Estimate")
    const lines = [
      `Vehicle: ${vehicleLabel}`,
      `Glass: ${selectedPart.position}${selectedPart.description ? ` (${selectedPart.description})` : ""}`,
      `Service: ${mobileService ? "Mobile" : "In-shop"}`,
      "",
      `Glass: $${quote.glassCost.toFixed(2)}`,
      `Labor: $${quote.laborCost.toFixed(2)}`,
      `Kit: $${quote.kitFee.toFixed(2)}`,
      quote.calibrationFee ? `ADAS Calibration: $${quote.calibrationFee.toFixed(2)}` : "",
      quote.mobileFee ? `Mobile Service: $${quote.mobileFee.toFixed(2)}` : "",
      `Tax: $${quote.taxCost.toFixed(2)}`,
      "",
      `Estimated Total: $${quote.totalCost.toFixed(2)}`,
      "",
      "Final price confirmed after VIN verification.",
    ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
    window.location.href = `mailto:${customerEmail || ""}?subject=${subject}&body=${encodeURIComponent(lines.join("\n"))}`
  }

  if (loadError) return <p className="text-sm text-red-600">{loadError}</p>
  if (!catalog) return <p className="text-sm text-slate-500">Loading vehicles...</p>

  if (parts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 p-8 text-center">
        <Car className="h-10 w-10 text-blue-700 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-800 mb-1">Online auto glass pricing is coming soon</h3>
        <p className="text-sm text-slate-500 mb-4">Call or message us with your year, make, and model and we'll quote it right away.</p>
        <Link to="/contact" className="inline-block rounded-md bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          Request a Quote
        </Link>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">2. Your Vehicle</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
              <select
                className={selectClass}
                value={year}
                onChange={(e) => {
                  setYear(e.target.value ? Number(e.target.value) : "")
                  setMake("")
                  setModel("")
                  setPosition("")
                }}
              >
                <option value="">Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Make</label>
              <select
                className={selectClass}
                value={make}
                disabled={year === ""}
                onChange={(e) => {
                  setMake(e.target.value)
                  setModel("")
                  setPosition("")
                }}
              >
                <option value="">Select make</option>
                {makes.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Model</label>
              <select
                className={selectClass}
                value={model}
                disabled={!make}
                onChange={(e) => {
                  setModel(e.target.value)
                  setPosition("")
                }}
              >
                <option value="">Select model</option>
                {models.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Don't see your vehicle? <Link to="/contact" className="text-blue-600 underline">Contact us</Link> for a quote.</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">3. Which Glass?</h2>
          {!model ? (
            <p className="text-sm text-slate-400">Choose your vehicle first.</p>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`rounded-lg border p-3 text-left text-sm font-medium transition-colors ${
                    position === pos ? "border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600" : "border-slate-200 text-slate-600 hover:border-blue-300"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          )}
        </div>

        {options.length > 1 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">4. Glass Options</h2>
            <p className="text-xs text-slate-500 mb-3">Your vehicle has more than one version of this glass. Pick the one that matches (check for a camera or sensor behind the mirror, heating lines, etc.).</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {options.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-sm cursor-pointer ${
                    partId === p.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <input type="radio" name="autoPart" checked={partId === p.id} onChange={() => setPartId(p.id)} className="accent-blue-600 mt-0.5" />
                  <span>
                    <span className="block text-slate-700">{p.description || "Standard"}</span>
                    {p.bodyStyle && <span className="block text-xs text-slate-400">{p.bodyStyle}</span>}
                    {p.calibrationRequired && <span className="block text-xs text-amber-600">Requires ADAS camera calibration</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">{options.length > 1 ? "5" : "4"}. Service Options</h2>
          <label className={`flex items-center justify-between rounded-lg border p-3 text-sm cursor-pointer ${mobileService ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}>
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={mobileService} onChange={(e) => setMobileService(e.target.checked)} className="accent-blue-600" />
              Mobile service — we come to your home or work
            </span>
            <span className="text-slate-500 text-xs">{catalog.mobileFee > 0 ? `+$${catalog.mobileFee}` : "Free"}</span>
          </label>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">{options.length > 1 ? "6" : "5"}. Contact Info (optional, for saving/emailing)</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <input placeholder="Full Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
            <input placeholder="Email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputClass} />
            <input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 self-start">
        <div className="rounded-xl border border-slate-200 shadow-sm p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Car className="h-5 w-5 text-blue-700" />
            <h3 className="font-semibold text-slate-800">Auto Glass Estimate</h3>
          </div>

          {!selectedPart ? (
            <p className="text-sm text-slate-500">Select your vehicle and the glass you need to see your price.</p>
          ) : (
            <>
              <div className="text-xs text-slate-500 mb-4">
                {vehicleLabel} &middot; {selectedPart.position}
                {selectedPart.description ? ` (${selectedPart.description})` : ""}
              </div>

              {quote ? (
                <>
                  <dl className={`space-y-2 text-sm ${quoting ? "opacity-50" : ""}`}>
                    <Row label="Glass" value={quote.glassCost} />
                    <Row label="Installation Labor" value={quote.laborCost} />
                    <Row label="Install Kit (urethane, molding)" value={quote.kitFee} />
                    {quote.calibrationFee > 0 && <Row label="ADAS Camera Calibration" value={quote.calibrationFee} />}
                    {quote.mobileFee > 0 && <Row label="Mobile Service" value={quote.mobileFee} />}
                    <Row label={`Tax (${quote.taxRatePercent}%)`} value={quote.taxCost} />
                  </dl>
                  <div className="border-t border-slate-200 my-4" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Estimated Total</span>
                    <span className="text-2xl font-bold text-blue-700">${quote.totalCost.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">{quoting ? "Calculating..." : ""}</p>
              )}

              {selectedPart.calibrationRequired && (
                <p className="mt-4 flex gap-1.5 text-xs text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  This glass has a forward-facing camera, so calibration is included to keep lane-assist and braking systems working.
                </p>
              )}
            </>
          )}

          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Final pricing is confirmed after we verify your VIN and glass options. Filing through insurance? We can bill your carrier directly.
          </p>

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          {saved && <p className="mt-3 text-xs text-green-600">Estimate saved! We'll follow up if you provided contact info.</p>}

          <div className="grid grid-cols-2 gap-2 mt-5">
            <button onClick={handleSave} disabled={!quote || saving} className="flex items-center justify-center gap-1.5 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => pdf().save(`boyd-auto-glass-estimate-${Date.now()}.pdf`)} disabled={!quote} className="flex items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
            <button onClick={handlePrint} disabled={!quote} className="flex items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button onClick={handleEmail} disabled={!quote} className="flex items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
          </div>
        </div>
      </div>
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
