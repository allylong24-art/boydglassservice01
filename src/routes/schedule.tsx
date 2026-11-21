import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useServerFn } from "@tanstack/react-start"
import { PageHero } from "../components/PageHero"
import { createAppointment } from "../server/appointments.functions"
import { uploadAppointmentPhoto } from "../server/uploads.functions"
import { createCheckoutSession } from "../server/payments.functions"
import { SERVICE_LABELS } from "../lib/pricing"
import { EMPTY_VEHICLE, VehiclePicker, formatVehicle, isVehicleComplete, type Vehicle } from "../components/VehiclePicker"
import { Upload, CheckCircle2, CreditCard } from "lucide-react"

export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
})

const TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]

function SchedulePage() {
  const createAppointmentFn = useServerFn(createAppointment)
  const uploadPhotoFn = useServerFn(uploadAppointmentPhoto)
  const createCheckoutFn = useServerFn(createCheckoutSession)

  const [serviceType, setServiceType] = useState("window")
  const [date, setDate] = useState("")
  const [time, setTime] = useState(TIME_SLOTS[0])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [vehicle, setVehicle] = useState<Vehicle>(EMPTY_VEHICLE)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [booked, setBooked] = useState(false)
  const [payError, setPayError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (serviceType === "auto" && !isVehicleComplete(vehicle)) {
      setError("Please select your vehicle's year, make, and model.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const photoKeys: string[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        const result = await uploadPhotoFn({ data: formData })
        photoKeys.push(result.key)
      }

      await createAppointmentFn({
        data: {
          serviceType,
          appointmentDate: date,
          appointmentTime: time,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          address,
          notes:
            serviceType === "auto"
              ? [`Vehicle: ${formatVehicle(vehicle)}`, notes].filter(Boolean).join("\n")
              : notes,
          photoKeys,
        },
      })
      setBooked(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong booking your appointment.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeposit() {
    setPayError("")
    try {
      const { url } = await createCheckoutFn({
        data: {
          amount: 50,
          description: `Deposit — ${SERVICE_LABELS[serviceType as keyof typeof SERVICE_LABELS] ?? serviceType} Appointment`,
          customerEmail: email || undefined,
          successUrl: window.location.origin + "/schedule?paid=1",
          cancelUrl: window.location.origin + "/schedule",
        },
      })
      if (url) window.location.href = url
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Payment is not available right now.")
    }
  }

  if (booked) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Appointment Booked!</h1>
        <p className="mt-3 text-slate-600">
          A confirmation email is on its way to {email}. We look forward to seeing you on {date} at {time}.
        </p>
        <p className="mt-6 text-sm text-slate-500">Want to secure your slot with a deposit?</p>
        <button onClick={handleDeposit} className="mt-2 inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
          <CreditCard className="h-4 w-4" /> Pay $50 Deposit
        </button>
        {payError && <p className="mt-3 text-xs text-red-600">{payError}</p>}
      </div>
    )
  }

  return (
    <div>
      <PageHero title="Schedule an Appointment" subtitle="Pick a service, date, and time — we'll confirm by email right away." compact />

      <section className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 p-8 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
              {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
              <option value="other">Other / Not Sure</option>
            </select>
          </div>

          {serviceType === "auto" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Vehicle</label>
              <VehiclePicker value={vehicle} onChange={setVehicle} />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Upload Photos of the Job (optional)</label>
            <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500 cursor-pointer hover:border-blue-400">
              <Upload className="h-4 w-4" />
              {files.length > 0 ? `${files.length} photo(s) selected` : "Click to upload photos"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full rounded-md bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
            {submitting ? "Booking..." : "Book Appointment"}
          </button>
        </form>
      </section>
    </div>
  )
}
