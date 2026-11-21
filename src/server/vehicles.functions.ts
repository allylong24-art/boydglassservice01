import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

// Live vehicle data from the free NHTSA vPIC API (https://vpic.nhtsa.dot.gov/api/).
// Results are cached per server instance to keep the picker fast and avoid
// hammering NHTSA; the source of truth is always NHTSA itself.

const VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles"
// Passenger cars, SUVs/minivans (MPV) and pickup trucks — the vehicles auto glass customers drive.
const VEHICLE_TYPES = ["car", "mpv", "truck"] as const
const CACHE_TTL_MS = 1000 * 60 * 60 * 12

export interface VehicleMake {
  id: number
  name: string
}

const cache = new Map<string, { at: number; value: unknown }>()

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as T
  const value = await load()
  cache.set(key, { at: Date.now(), value })
  return value
}

async function vpic<T>(path: string): Promise<T[]> {
  const res = await fetch(`${VPIC}/${path}${path.includes("?") ? "&" : "?"}format=json`, {
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error("Vehicle lookup is temporarily unavailable. Please try again.")
  const json = (await res.json()) as { Results?: T[] }
  return json.Results ?? []
}

export const getVehicleMakes = createServerFn({ method: "GET" }).handler(async (): Promise<VehicleMake[]> => {
  return cached("makes", async () => {
    const lists = await Promise.all(
      VEHICLE_TYPES.map((t) => vpic<{ MakeId: number; MakeName: string }>(`GetMakesForVehicleType/${t}`))
    )
    const byId = new Map<number, string>()
    for (const r of lists.flat()) byId.set(r.MakeId, r.MakeName.trim())
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })
})

export const getVehicleModels = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      makeId: z.number().int().positive(),
      year: z.number().int().min(1950).max(new Date().getFullYear() + 2),
    })
  )
  .handler(async ({ data }): Promise<string[]> => {
    return cached(`models:${data.makeId}:${data.year}`, async () => {
      const lists = await Promise.all(
        VEHICLE_TYPES.map((t) =>
          vpic<{ Model_Name: string }>(`GetModelsForMakeIdYear/makeId/${data.makeId}/modelyear/${data.year}/vehicletype/${t}`)
        )
      )
      const names = new Set(lists.flat().map((r) => r.Model_Name.trim()).filter((n) => /[a-z0-9]/i.test(n)))
      return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    })
  })
