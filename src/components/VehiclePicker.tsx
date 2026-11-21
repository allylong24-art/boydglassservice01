import { useEffect, useState } from "react"
import { useServerFn } from "@tanstack/react-start"
import { Car, Loader2 } from "lucide-react"
import { getVehicleMakes, getVehicleModels, type VehicleMake } from "../server/vehicles.functions"

export interface Vehicle {
  year: number | null
  makeId: number | null
  make: string
  model: string
}

export const EMPTY_VEHICLE: Vehicle = { year: null, makeId: null, make: "", model: "" }

export function isVehicleComplete(v: Vehicle): v is Vehicle & { year: number; makeId: number } {
  return v.year !== null && v.makeId !== null && v.make !== "" && v.model !== ""
}

export function formatVehicle(v: Vehicle) {
  return [v.year, v.make, v.model].filter(Boolean).join(" ")
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR + 1 - 1981 + 1 }, (_, i) => CURRENT_YEAR + 1 - i)

// Shown first so customers don't scroll past hundreds of small custom builders in the NHTSA list.
const POPULAR_MAKES = new Set([
  "ACURA", "AUDI", "BMW", "BUICK", "CADILLAC", "CHEVROLET", "CHRYSLER", "DODGE", "FORD", "GMC", "HONDA",
  "HYUNDAI", "INFINITI", "JEEP", "KIA", "LEXUS", "LINCOLN", "MAZDA", "MERCEDES-BENZ", "MITSUBISHI", "NISSAN",
  "RAM", "SUBARU", "TESLA", "TOYOTA", "VOLKSWAGEN", "VOLVO",
])

const selectClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"

export function VehiclePicker({ value, onChange }: { value: Vehicle; onChange: (v: Vehicle) => void }) {
  const getMakesFn = useServerFn(getVehicleMakes)
  const getModelsFn = useServerFn(getVehicleModels)

  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<string[]>([])
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoadingMakes(true)
    getMakesFn()
      .then((m) => !cancelled && setMakes(m))
      .catch(() => !cancelled && setError("Couldn't load vehicle makes. Please refresh and try again."))
      .finally(() => !cancelled && setLoadingMakes(false))
    return () => {
      cancelled = true
    }
  }, [getMakesFn])

  useEffect(() => {
    setModels([])
    if (value.year === null || value.makeId === null) return
    let cancelled = false
    setLoadingModels(true)
    setError("")
    getModelsFn({ data: { makeId: value.makeId, year: value.year } })
      .then((m) => !cancelled && setModels(m))
      .catch(() => !cancelled && setError("Couldn't load models. Please try again."))
      .finally(() => !cancelled && setLoadingModels(false))
    return () => {
      cancelled = true
    }
  }, [getModelsFn, value.year, value.makeId])

  const noModels = value.year !== null && value.makeId !== null && !loadingModels && !error && models.length === 0

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
          <select
            value={value.year ?? ""}
            onChange={(e) => onChange({ ...value, year: e.target.value ? Number(e.target.value) : null, model: "" })}
            className={selectClass}
          >
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Make</label>
          <select
            value={value.makeId ?? ""}
            disabled={value.year === null || loadingMakes}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null
              const make = makes.find((m) => m.id === id)
              onChange({ ...value, makeId: id, make: make?.name ?? "", model: "" })
            }}
            className={selectClass}
          >
            <option value="">{loadingMakes ? "Loading makes..." : "Select make"}</option>
            {makes.length > 0 && (
              <>
                <optgroup label="Popular makes">
                  {makes.filter((m) => POPULAR_MAKES.has(m.name.toUpperCase())).map((m) => (
                    <option key={`p-${m.id}`} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
                <optgroup label="All makes">
                  {makes.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Model</label>
          <select
            value={value.model}
            disabled={value.makeId === null || loadingModels || models.length === 0}
            onChange={(e) => onChange({ ...value, model: e.target.value })}
            className={selectClass}
          >
            <option value="">{loadingModels ? "Loading models..." : "Select model"}</option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-2 min-h-5 text-xs">
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : noModels ? (
          <span className="text-amber-700">No models found for that year and make. Check the year, or call us and we'll look it up.</span>
        ) : loadingModels ? (
          <span className="inline-flex items-center gap-1 text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /> Looking up models…</span>
        ) : isVehicleComplete(value) ? (
          <span className="inline-flex items-center gap-1 text-green-700"><Car className="h-3.5 w-3.5" /> {formatVehicle(value)}</span>
        ) : (
          <span className="text-slate-400">Vehicle data provided by the NHTSA vehicle database.</span>
        )}
      </div>
    </div>
  )
}
