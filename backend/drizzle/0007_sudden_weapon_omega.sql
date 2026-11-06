CREATE TABLE "queue_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"customer_id" uuid,
	"walk_in_name" text,
	"requested_stylist_id" uuid,
	"requested_service_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_stylist_id" uuid,
	"assigned_chair_id" uuid,
	"called_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"left_reason" text
);
--> statement-breakpoint
CREATE INDEX "queue_entry_branch_status_idx" ON "queue_entry" USING btree ("branch_id","status");--> statement-breakpoint
CREATE INDEX "queue_entry_salon_idx" ON "queue_entry" USING btree ("salon_id");