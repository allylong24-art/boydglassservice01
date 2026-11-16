import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "../../db/index.js"
import { appointments } from "../../db/schema.js"
import { desc, eq } from "drizzle-orm"
import { requireAuthMiddleware } from "../middleware/identity"
import { sendEmail } from "./email.server"

const AppointmentSchema = z.object({
  serviceType: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  address: z.string().optional(),
  notes: z.string().optional(),
  photoKeys: z.array(z.string()).optional(),
})

export const createAppointment = createServerFn({ method: "POST" })
  .inputValidator(AppointmentSchema)
  .handler(async ({ data }) => {
    const [row] = await db
      .insert(appointments)
      .values({
        serviceType: data.serviceType,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        address: data.address || null,
        notes: data.notes || null,
        photoKeys: data.photoKeys || [],
      })
      .returning()

    await sendEmail({
      to: data.customerEmail,
      subject: "Boyd Glass Service — Appointment Confirmed",
      html: `<h2>Appointment Confirmed</h2>
        <p>Hi ${data.customerName}, your appointment has been booked.</p>
        <p><strong>Service:</strong> ${data.serviceType}</p>
        <p><strong>Date:</strong> ${data.appointmentDate} at ${data.appointmentTime}</p>
        <p>We'll reach out if we need any additional details. Thank you for choosing Boyd Glass Service!</p>`,
    })

    return row
  })

export const listAppointments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.select().from(appointments).orderBy(desc(appointments.createdAt))
  })

export const updateAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.number(), status: z.string() }))
  .handler(async ({ data }) => {
    const [row] = await db
      .update(appointments)
      .set({ status: data.status })
      .where(eq(appointments.id, data.id))
      .returning()
    return row
  })
