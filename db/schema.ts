import { pgTable, serial, text, timestamp, integer, numeric, boolean, jsonb } from "drizzle-orm/pg-core";

export const pricingConfig = pgTable("pricing_config", {
  id: serial().primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("flat"),
  category: text("category").notNull().default("general"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const estimates = pgTable("estimates", {
  id: serial().primaryKey(),
  serviceType: text("service_type").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  inputData: jsonb("input_data").notNull(),
  materialsCost: numeric("materials_cost", { precision: 10, scale: 2 }).notNull(),
  laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).notNull(),
  feesCost: numeric("fees_cost", { precision: 10, scale: 2 }).notNull(),
  taxCost: numeric("tax_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial().primaryKey(),
  serviceType: text("service_type").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  address: text("address"),
  notes: text("notes"),
  photoKeys: jsonb("photo_keys").default([]),
  status: text("status").notNull().default("pending"),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial().primaryKey(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  serviceType: text("service_type"),
  approved: boolean("approved").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const galleryImages = pgTable("gallery_images", {
  id: serial().primaryKey(),
  blobKey: text("blob_key").notNull(),
  caption: text("caption"),
  category: text("category").notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Automotive glass parts entered by the shop from their NAGS books/software.
// NAGS list prices and labor hours are licensed data, so they are never sent to the browser —
// customer prices are computed server-side in src/server/auto-glass.functions.ts.
export const autoGlassParts = pgTable("auto_glass_parts", {
  id: serial().primaryKey(),
  nagsNumber: text("nags_number").notNull(),
  yearStart: integer("year_start").notNull(),
  yearEnd: integer("year_end").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  bodyStyle: text("body_style"),
  position: text("position").notNull(),
  description: text("description"),
  listPrice: numeric("list_price", { precision: 10, scale: 2 }).notNull(),
  laborHours: numeric("labor_hours", { precision: 6, scale: 2 }).notNull(),
  calibrationRequired: boolean("calibration_required").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
