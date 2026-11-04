CREATE TABLE "appointment_reschedule" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"from_start_at" timestamp with time zone NOT NULL,
	"from_end_at" timestamp with time zone NOT NULL,
	"to_start_at" timestamp with time zone NOT NULL,
	"to_end_at" timestamp with time zone NOT NULL,
	"rescheduled_by" uuid NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "booking_hold" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"stylist_id" uuid NOT NULL,
	"chair_id" uuid,
	"service_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"held_by" uuid NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "booking_request" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"stylist_id" uuid NOT NULL,
	"service_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"appointment_id" uuid,
	"decided_by" uuid
);
--> statement-breakpoint
CREATE TABLE "shift_template" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"stylist_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"name" text NOT NULL,
	"chair_id" uuid,
	"pattern" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stylist_shift" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"stylist_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"chair_id" uuid,
	"kind" text DEFAULT 'regular' NOT NULL,
	"template_id" uuid
);
--> statement-breakpoint
CREATE TABLE "stylist_time_off" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"stylist_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"from_at" timestamp with time zone NOT NULL,
	"to_at" timestamp with time zone NOT NULL,
	"reason" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"decided_by" uuid
);
--> statement-breakpoint
CREATE TABLE "disruption_offer" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"disruption_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"choice" text DEFAULT 'pending' NOT NULL,
	"stand_in_stylist_id" uuid,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"escalated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "disruption" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"stylist_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"minutes_late" integer,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by" uuid NOT NULL,
	"notified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cut_record_photo" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"cut_record_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"angle" text DEFAULT 'front' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cut_record" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"appointment_id" uuid,
	"ticket_id" uuid,
	"stylist_id" uuid NOT NULL,
	"service_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"clipper_guards" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fade_type" text,
	"parting_notes" text,
	"beard_notes" text,
	"products_used" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"free_text" text
);
--> statement-breakpoint
CREATE TABLE "formula_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"stylist_id" uuid,
	"kind" text NOT NULL,
	"formula" text NOT NULL,
	"developer" text,
	"processing_min" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "communication_consent" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"purpose" text NOT NULL,
	"status" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_note" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_preference" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"preferred_stylist_id" uuid,
	"preferred_chair_id" uuid,
	"drink" text,
	"conversation_level" text,
	"communication_channel" text
);
--> statement-breakpoint
CREATE TABLE "customer_tag" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"tag" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"points_balance" integer DEFAULT 0 NOT NULL,
	"tier" text
);
--> statement-breakpoint
CREATE TABLE "loyalty_ledger" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"delta" integer NOT NULL,
	"source" text NOT NULL,
	"source_id" uuid,
	"reason" text,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "loyalty_rule" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"points_per_unit" integer DEFAULT 1 NOT NULL,
	"tiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expiry_days" integer
);
--> statement-breakpoint
CREATE TABLE "notification_delivery" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"template_key" text NOT NULL,
	"channel" text NOT NULL,
	"recipient" text NOT NULL,
	"customer_id" uuid,
	"status" text NOT NULL,
	"failure_reason" text,
	"body" text NOT NULL,
	"dedupe_key" text
);
--> statement-breakpoint
CREATE TABLE "notification_template" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"key" text NOT NULL,
	"channel" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"body" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "original_stylist_id" uuid;--> statement-breakpoint
CREATE INDEX "appointment_reschedule_appt_idx" ON "appointment_reschedule" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "booking_hold_stylist_start_idx" ON "booking_hold" USING btree ("stylist_id","start_at");--> statement-breakpoint
CREATE INDEX "booking_request_branch_status_idx" ON "booking_request" USING btree ("branch_id","status");--> statement-breakpoint
CREATE INDEX "shift_template_stylist_idx" ON "shift_template" USING btree ("stylist_id");--> statement-breakpoint
CREATE INDEX "stylist_shift_stylist_start_idx" ON "stylist_shift" USING btree ("stylist_id","start_at");--> statement-breakpoint
CREATE INDEX "stylist_shift_branch_start_idx" ON "stylist_shift" USING btree ("branch_id","start_at");--> statement-breakpoint
CREATE INDEX "stylist_time_off_stylist_from_idx" ON "stylist_time_off" USING btree ("stylist_id","from_at");--> statement-breakpoint
CREATE INDEX "disruption_offer_disruption_idx" ON "disruption_offer" USING btree ("disruption_id");--> statement-breakpoint
CREATE INDEX "disruption_offer_appointment_idx" ON "disruption_offer" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "disruption_branch_status_idx" ON "disruption" USING btree ("branch_id","status");--> statement-breakpoint
CREATE INDEX "cut_record_photo_record_idx" ON "cut_record_photo" USING btree ("cut_record_id");--> statement-breakpoint
CREATE INDEX "cut_record_customer_idx" ON "cut_record" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "formula_entry_customer_idx" ON "formula_entry" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "communication_consent_key" ON "communication_consent" USING btree ("customer_id","channel","purpose");--> statement-breakpoint
CREATE INDEX "customer_note_customer_idx" ON "customer_note" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_preference_customer_key" ON "customer_preference" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_tag_key" ON "customer_tag" USING btree ("customer_id","tag");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_account_customer_key" ON "loyalty_account" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "loyalty_ledger_customer_idx" ON "loyalty_ledger" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_ledger_kind_source_key" ON "loyalty_ledger" USING btree ("kind","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_rule_salon_key" ON "loyalty_rule" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "notification_delivery_salon_created_idx" ON "notification_delivery" USING btree ("salon_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_delivery_dedupe_key" ON "notification_delivery" USING btree ("salon_id","dedupe_key");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_template_key" ON "notification_template" USING btree ("salon_id","key","channel","version");