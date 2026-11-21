CREATE TABLE "auto_glass_parts" (
	"id" serial PRIMARY KEY,
	"nags_number" text NOT NULL,
	"year_start" integer NOT NULL,
	"year_end" integer NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"body_style" text,
	"position" text NOT NULL,
	"description" text,
	"list_price" numeric(10,2) NOT NULL,
	"labor_hours" numeric(6,2) NOT NULL,
	"calibration_required" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
