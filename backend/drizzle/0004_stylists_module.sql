CREATE TABLE "stylist_profile" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"bio" text,
	"avatar_url" text,
	"specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'off_shift' NOT NULL,
	"is_bookable" boolean DEFAULT true NOT NULL,
	"started_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stylist_service" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"stylist_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"price_override_minor" integer,
	"duration_override_min" integer,
	"can_perform" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stylist_status_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"stylist_id" uuid NOT NULL,
	"status" text NOT NULL,
	"reason" text,
	"changed_by" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "stylist_profile_salon_idx" ON "stylist_profile" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "stylist_profile_branch_idx" ON "stylist_profile" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stylist_profile_salon_user_key" ON "stylist_profile" USING btree ("salon_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stylist_service_key" ON "stylist_service" USING btree ("stylist_id","service_id");--> statement-breakpoint
CREATE INDEX "stylist_service_stylist_idx" ON "stylist_service" USING btree ("stylist_id");--> statement-breakpoint
CREATE INDEX "stylist_service_service_idx" ON "stylist_service" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "stylist_status_history_stylist_idx" ON "stylist_status_history" USING btree ("stylist_id");