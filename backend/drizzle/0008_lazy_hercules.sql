CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"stylist_id" uuid NOT NULL,
	"chair_id" uuid,
	"customer_id" uuid,
	"service_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"add_on_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'booked' NOT NULL,
	"source" text DEFAULT 'front_desk' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE INDEX "appointment_branch_start_idx" ON "appointment" USING btree ("branch_id","start_at");--> statement-breakpoint
CREATE INDEX "appointment_stylist_start_idx" ON "appointment" USING btree ("stylist_id","start_at");--> statement-breakpoint
CREATE INDEX "appointment_chair_start_idx" ON "appointment" USING btree ("chair_id","start_at");