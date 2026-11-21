import { useEffect, useMemo, useState } from "react"
import { useServerFn } from "@tanstack/react-start"
import { Pencil, Trash2, Upload, Plus, X } from "lucide-react"
import { createAutoPart, deleteAutoPart, importAutoParts, listAutoParts, updateAutoPart } from "../../server/auto-glass.functions"
import { AUTO_CSV_HEADERS, AUTO_GLASS_POSITIONS, parseAutoPartsCsv, type AutoPartInput } from "../../lib/autoGlass"

type PartRow = Awaited<ReturnType<typeof listAutoParts>>[number]

const inputClass = "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
const thisYear = new Date().getFullYear()

const emptyForm = {
  nagsNumber: "",
  yearStart: String(thisYear),
  yearEnd: String(thisYear),
  make: "",
  model: "",
  bodyStyle: "",
  position: AUTO_GLASS_POSITIONS[0] as string,
  description: "",
  listPrice: "",
  laborHours: "",
  calibrationRequired: false,
  active: true,
}
type FormState = typeof emptyForm

function rowToForm(r: PartRow): FormState {
  return {
    nagsNumber: r.nagsNumber,
    yearStart: String(r.yearStart),
    yearEnd: String(r.yearEnd),
    make: r.make,
    model: r.model,
    bodyStyle: r.bodyStyle ?? "",
    position: r.position,
    description: r.description ?? "",
    listPrice: r.listPrice,
    laborHours: r.laborHours,
    calibrationRequired: r.calibrationRequired,
    active: r.active,
  }
}

function formToInput(f: FormState): AutoPartInput {
  return {
    nagsNumber: f.nagsNumber.trim(),
    yearStart: parseInt(f.yearStart, 10),
    yearEnd: parseInt(f.yearEnd, 10),
    make: f.make.trim(),
    model: f.model.trim(),
    bodyStyle: f.bodyStyle.trim() || null,
    position: f.position,
    description: f.description.trim() || null,
    listPrice: Number(f.listPrice),
    laborHours: Number(f.laborHours),
    calibrationRequired: f.calibrationRequired,
    active: f.active,
  }
}

export function AutoPartsTab() {
  const listFn = useServerFn(listAutoParts)
  const createFn = useServerFn(createAutoPart)
  const updateFn = useServerFn(updateAutoPart)
  const deleteFn = useServerFn(deleteAutoPart)
  const importFn = useServerFn(importAutoParts)

  const [rows, setRows] = useState<PartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)
  const [search, setSearch] = useState("")
  const [importing, setImporting] = useState(false)

  async function refresh() {
    setRows(await listFn())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.nagsNumber, r.make, r.model, r.bodyStyle, r.position, r.description, `${r.yearStart}-${r.yearEnd}`]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [rows, search])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function startAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setMessage(null)
  }

  function startEdit(r: PartRow) {
    setEditingId(r.id)
    setForm(rowToForm(r))
    setShowForm(true)
    setMessage(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const part = formToInput(form)
    if (!Number.isFinite(part.yearStart) || !Number.isFinite(part.yearEnd) || part.yearEnd < part.yearStart) {
      setMessage({ kind: "error", text: "Check the year range." })
      return
    }
    if (!Number.isFinite(part.listPrice) || !Number.isFinite(part.laborHours) || form.listPrice === "" || form.laborHours === "") {
      setMessage({ kind: "error", text: "NAGS list price and labor hours are required." })
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const updated = await updateFn({ data: { id: editingId, part } })
        setRows((prev) => prev.map((r) => (r.id === editingId ? updated : r)))
        setMessage({ kind: "ok", text: `Updated ${updated.nagsNumber}.` })
        setShowForm(false)
      } else {
        const created = await createFn({ data: part })
        setRows((prev) => [...prev, created])
        setMessage({ kind: "ok", text: `Added ${created.nagsNumber}. Fill in the next part or close the form.` })
        // Keep vehicle info so several glass positions for one vehicle are quick to enter.
        setForm((f) => ({ ...f, nagsNumber: "", description: "", listPrice: "", laborHours: "", calibrationRequired: false }))
      }
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Couldn't save part." })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(r: PartRow) {
    if (!confirm(`Delete ${r.nagsNumber} (${r.yearStart}-${r.yearEnd} ${r.make} ${r.model} ${r.position})?`)) return
    await deleteFn({ data: { id: r.id } })
    setRows((prev) => prev.filter((x) => x.id !== r.id))
  }

  async function toggleActive(r: PartRow) {
    const updated = await updateFn({ data: { id: r.id, part: { ...formToInput(rowToForm(r)), active: !r.active } } })
    setRows((prev) => prev.map((x) => (x.id === r.id ? updated : x)))
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setImporting(true)
    setMessage(null)
    try {
      const { parts, errors } = parseAutoPartsCsv(await file.text())
      if (parts.length === 0) {
        setMessage({ kind: "error", text: errors.join(" ") || "No parts found in that file." })
        return
      }
      const { inserted } = await importFn({ data: { parts } })
      await refresh()
      setMessage({
        kind: errors.length ? "error" : "ok",
        text: `Imported ${inserted} part(s).${errors.length ? ` Skipped ${errors.length}: ${errors.slice(0, 5).join(" ")}${errors.length > 5 ? " ..." : ""}` : ""}`,
      })
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Import failed." })
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const example = ["FW04567", "2018", "2022", "Honda", "Accord", "4 Door Sedan", "Windshield", "w/ lane departure camera, rain sensor", "412.50", "2.5", "yes"]
    const csv = [AUTO_CSV_HEADERS.join(","), example.map((c) => `"${c}"`).join(",")].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "nags-parts-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
        Enter parts from your NAGS book or software. Customers pick their vehicle and glass on the{" "}
        <a href="/estimate" className="text-blue-700 underline">estimate page</a> and see a price of{" "}
        <strong>NAGS list × glass % + labor hours × labor rate + kit fee</strong> (plus calibration when required and
        optional mobile fee). Set those rates under the <strong>Pricing</strong> tab. NAGS numbers, list prices, and labor
        hours are never shown to customers.
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={startAdd} className="flex items-center gap-1.5 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          <Plus className="h-4 w-4" /> Add Part
        </button>
        <label className="flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
          <Upload className="h-4 w-4" /> {importing ? "Importing..." : "Import CSV"}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
        <button onClick={downloadTemplate} className="text-sm text-blue-700 underline">Download CSV template</button>
        <input placeholder="Search parts..." value={search} onChange={(e) => setSearch(e.target.value)} className="ml-auto rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {message && <p className={`text-sm ${message.kind === "ok" ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{editingId ? "Edit Part" : "Add Part"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Year From"><input type="number" required value={form.yearStart} onChange={(e) => set("yearStart", e.target.value)} className={inputClass} /></Field>
            <Field label="Year To"><input type="number" required value={form.yearEnd} onChange={(e) => set("yearEnd", e.target.value)} className={inputClass} /></Field>
            <Field label="Make"><input required value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="Honda" className={inputClass} /></Field>
            <Field label="Model"><input required value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Accord" className={inputClass} /></Field>
            <Field label="Body Style (optional)"><input value={form.bodyStyle} onChange={(e) => set("bodyStyle", e.target.value)} placeholder="4 Door Sedan" className={inputClass} /></Field>
            <Field label="Glass Position">
              <select value={form.position} onChange={(e) => set("position", e.target.value)} className={inputClass}>
                {AUTO_GLASS_POSITIONS.map((p) => <option key={p}>{p}</option>)}
                {!AUTO_GLASS_POSITIONS.includes(form.position as any) && <option>{form.position}</option>}
              </select>
            </Field>
            <Field label="NAGS Part #"><input required value={form.nagsNumber} onChange={(e) => set("nagsNumber", e.target.value)} placeholder="FW04567" className={inputClass} /></Field>
            <Field label="Options shown to customer"><input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="w/ rain sensor, heated" className={inputClass} /></Field>
            <Field label="NAGS List Price ($)"><input type="number" step="0.01" min="0" required value={form.listPrice} onChange={(e) => set("listPrice", e.target.value)} className={inputClass} /></Field>
            <Field label="NAGS Labor Hours"><input type="number" step="0.1" min="0" required value={form.laborHours} onChange={(e) => set("laborHours", e.target.value)} className={inputClass} /></Field>
            <label className="flex items-center gap-2 text-sm text-slate-600 sm:mt-5">
              <input type="checkbox" checked={form.calibrationRequired} onChange={(e) => set("calibrationRequired", e.target.checked)} className="accent-blue-600" />
              Requires ADAS calibration
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 sm:mt-5">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="accent-blue-600" />
              Show on estimate page
            </label>
          </div>
          <button type="submit" disabled={saving} className="rounded-md bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Part"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading parts...</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-500 text-sm">No NAGS parts yet. Add parts one at a time or import a CSV to turn on online auto glass pricing.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-3">NAGS #</th>
                <th className="px-3 py-3">Vehicle</th>
                <th className="px-3 py-3">Glass</th>
                <th className="px-3 py-3 text-right">List</th>
                <th className="px-3 py-3 text-right">Hours</th>
                <th className="px-3 py-3">ADAS</th>
                <th className="px-3 py-3">Live</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className={r.active ? "" : "text-slate-400"}>
                  <td className="px-3 py-2 font-mono text-xs">{r.nagsNumber}</td>
                  <td className="px-3 py-2">
                    {r.yearStart === r.yearEnd ? r.yearStart : `${r.yearStart}-${r.yearEnd}`} {r.make} {r.model}
                    {r.bodyStyle && <span className="block text-xs text-slate-400">{r.bodyStyle}</span>}
                  </td>
                  <td className="px-3 py-2">
                    {r.position}
                    {r.description && <span className="block text-xs text-slate-400">{r.description}</span>}
                  </td>
                  <td className="px-3 py-2 text-right">${Number(r.listPrice).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.laborHours)}</td>
                  <td className="px-3 py-2">{r.calibrationRequired ? "Yes" : "—"}</td>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={r.active} onChange={() => toggleActive(r)} className="accent-blue-600" title="Show on estimate page" />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <button onClick={() => startEdit(r)} className="p-1 text-slate-400 hover:text-blue-700" title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(r)} className="p-1 text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-xs text-slate-400 bg-slate-50">{filtered.length} of {rows.length} parts</p>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
