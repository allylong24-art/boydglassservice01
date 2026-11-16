CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY,
	"service_type" text NOT NULL,
	"appointment_date" text NOT NULL,
	"appointment_time" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"address" text,
	"notes" text,
	"photo_keys" jsonb DEFAULT '[]',
	"status" text DEFAULT 'pending' NOT NULL,
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" serial PRIMARY KEY,
	"service_type" text NOT NULL,
	"customer_name" text,
	"customer_email" text,
	"customer_phone" text,
	"input_data" jsonb NOT NULL,
	"materials_cost" numeric(10,2) NOT NULL,
	"labor_cost" numeric(10,2) NOT NULL,
	"fees_cost" numeric(10,2) NOT NULL,
	"tax_cost" numeric(10,2) NOT NULL,
	"total_cost" numeric(10,2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gallery_images" (
	"id" serial PRIMARY KEY,
	"blob_key" text NOT NULL,
	"caption" text,
	"category" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_config" (
	"id" serial PRIMARY KEY,
	"key" text NOT NULL UNIQUE,
	"label" text NOT NULL,
	"value" numeric(10,2) NOT NULL,
	"unit" text DEFAULT 'flat' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY,
	"customer_name" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"service_type" text,
	"approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
