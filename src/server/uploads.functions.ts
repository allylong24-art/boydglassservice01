import { createServerFn } from "@tanstack/react-start"
import { getStore } from "@netlify/blobs"

export const uploadAppointmentPhoto = createServerFn({ method: "POST" })
  .inputValidator((formData: FormData) => formData)
  .handler(async ({ data: formData }) => {
    const file = formData.get("file") as File
    const key = `appointments/${Date.now()}-${file.name}`
    const store = getStore("appointment-photos")
    await store.set(key, await file.arrayBuffer())
    return { key }
  })
