import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useIdentity } from "../../lib/identity-context"
import { AdminLogin } from "../../components/AdminLogin"
import { useServerFn } from "@tanstack/react-start"
import { listAppointments, updateAppointmentStatus } from "../../server/appointments.functions"
import { listEstimates } from "../../server/estimates.functions"
import { listPricingConfig, updatePricingConfig, exportCustomerData } from "../../server/admin.functions"
import { listGallery, uploadGalleryImage, deleteGalleryImage } from "../../server/gallery.functions"
import { listAllReviewsAdmin } from "../../server/reviews.functions"
import { LogOut, Calendar, Calculator, DollarSign, Image as ImageIcon, Download, Star } from "lucide-react"

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
})

type Tab = "appointments" | "estimates" | "pricing" | "gallery" | "reviews" | "export"

function AdminPage() {
  const { user, ready, logout } = useIdentity()

  if (!ready) return <div className="py-24 text-center text-slate-500">Loading...</div>

  if (!user) return <AdminLogin />

  return <Dashboard onLogout={logout} />
}

function Dashboard({ onLogout }: { onLogout: () => Promise<void> }) {
  const [tab, setTab] = useState<Tab>("appointments")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <button onClick={() => onLogout()} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-600">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200">
        {(
          [
            ["appointments", "Appointments", Calendar],
            ["estimates", "Estimates", Calculator],
            ["pricing", "Pricing", DollarSign],
            ["gallery", "Gallery", ImageIcon],
            ["reviews", "Reviews", Star],
            ["export", "Export Data", Download],
          ] as [Tab, string, any][]
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "appointments" && <AppointmentsTab />}
      {tab === "estimates" && <EstimatesTab />}
      {tab === "pricing" && <PricingTab />}
      {tab === "gallery" && <GalleryTab />}
      {tab === "reviews" && <ReviewsTab />}
      {tab === "export" && <ExportTab />}
    </div>
  )
}

function AppointmentsTab() {
  const listFn = useServerFn(listAppointments)
  const updateFn = useServerFn(updateAppointmentStatus)
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAppointments>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listFn().then((r) => {
      setRows(r)
      setLoading(false)
    })
  }, [])

  async function setStatus(id: number, status: string) {
    const updated = await updateFn({ data: { id, status } })
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)))
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading appointments...</p>
  if (rows.length === 0) return <p className="text-slate-500 text-sm">No appointments yet.</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Date / Time</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Photos</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium text-slate-800">{r.customerName}</td>
              <td className="px-4 py-3 text-slate-600">{r.serviceType}</td>
              <td className="px-4 py-3 text-slate-600">{r.appointmentDate} {r.appointmentTime}</td>
              <td className="px-4 py-3 text-slate-600">{r.customerEmail}<br />{r.customerPhone}</td>
              <td className="px-4 py-3 text-slate-600">
                {Array.isArray(r.photoKeys) && r.photoKeys.length > 0 ? (
                  <div className="flex gap-1">
                    {(r.photoKeys as string[]).map((k) => (
                      <a key={k} href={`/api/appointment-photo/${k.replace("appointments/", "")}`} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">
                        photo
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EstimatesTab() {
  const listFn = useServerFn(listEstimates)
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listEstimates>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listFn().then((r) => {
      setRows(r)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-slate-500 text-sm">Loading estimates...</p>
  if (rows.length === 0) return <p className="text-slate-500 text-sm">No estimates yet.</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium text-slate-800">{r.customerName || "—"}<br /><span className="text-xs text-slate-400">{r.customerEmail}</span></td>
              <td className="px-4 py-3 text-slate-600">{r.serviceType}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">${r.totalCost}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PricingTab() {
  const listFn = useServerFn(listPricingConfig)
  const updateFn = useServerFn(updatePricingConfig)
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listPricingConfig>>>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    listFn().then((r) => {
      setRows(r)
      setLoading(false)
    })
  }, [])

  async function save(id: number, value: string) {
    setSavingId(id)
    const num = Number(value)
    if (!Number.isNaN(num)) {
      const updated = await updateFn({ data: { id, value: num } })
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)))
    }
    setSavingId(null)
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading pricing config...</p>

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border border-slate-200 p-4">
          <label className="block text-xs font-medium text-slate-500 mb-1">{r.label}</label>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">$</span>
            <input
              type="number"
              defaultValue={r.value}
              onBlur={(e) => save(r.id, e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {savingId === r.id && <span className="text-xs text-slate-400">saving...</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function GalleryTab() {
  const listFn = useServerFn(listGallery)
  const uploadFn = useServerFn(uploadGalleryImage)
  const deleteFn = useServerFn(deleteGalleryImage)
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listGallery>>>([])
  const [loading, setLoading] = useState(true)
  const [caption, setCaption] = useState("")
  const [category, setCategory] = useState("general")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    listFn().then((r) => {
      setRows(r)
      setLoading(false)
    })
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("caption", caption)
    formData.append("category", category)
    const row = await uploadFn({ data: formData })
    setRows((prev) => [row, ...prev])
    setCaption("")
    setUploading(false)
    e.target.value = ""
  }

  async function handleDelete(id: number) {
    await deleteFn({ data: { id } })
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-6 rounded-lg border border-slate-200 p-4">
        <input placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="general">General</option>
          <option value="window">Window</option>
          <option value="shower">Shower</option>
          <option value="commercial">Commercial</option>
          <option value="auto">Auto</option>
        </select>
        <label className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-blue-800">
          {uploading ? "Uploading..." : "Upload Photo"}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading gallery...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {rows.map((img) => (
            <div key={img.id} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square group">
              <img src={`/api/gallery-image/${img.blobKey.replace("gallery/", "")}`} alt={img.caption || ""} className="w-full h-full object-cover" />
              <button onClick={() => handleDelete(img.id)} className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewsTab() {
  const listFn = useServerFn(listAllReviewsAdmin)
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAllReviewsAdmin>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listFn().then((r) => {
      setRows(r)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-slate-500 text-sm">Loading reviews...</p>

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800">{r.customerName} — {r.rating}★</p>
            <p className="text-sm text-slate-500">{r.comment}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${r.approved ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {r.approved ? "Published" : "Hidden"}
          </span>
        </div>
      ))}
    </div>
  )
}

function ExportTab() {
  const exportFn = useServerFn(exportCustomerData)
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const data = await exportFn()
    const rows = [
      ["Type", "Name", "Email", "Phone", "Service", "Total/Status", "Date"],
      ...data.estimates.map((e) => ["Estimate", e.customerName || "", e.customerEmail || "", e.customerPhone || "", e.serviceType, e.totalCost, e.createdAt]),
      ...data.appointments.map((a) => ["Appointment", a.customerName, a.customerEmail, a.customerPhone, a.serviceType, a.status, a.createdAt]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `boyd-glass-customers-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setLoading(false)
  }

  return (
    <div className="rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto">
      <Download className="h-10 w-10 text-blue-700 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-slate-800 mb-2">Export Customer Data</h2>
      <p className="text-sm text-slate-500 mb-6">Download all estimates and appointments as a CSV file.</p>
      <button onClick={handleExport} disabled={loading} className="rounded-md bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
        {loading ? "Exporting..." : "Export to CSV"}
      </button>
    </div>
  )
}
