CREATE TABLE "service_add_on_link" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"add_on_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_add_on" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_minor" integer NOT NULL,
	"duration_min" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_category" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"base_price_minor" integer NOT NULL,
	"base_duration_min" integer NOT NULL,
	"tax_rate_id" uuid,
	"is_bookable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_add_on_link_key" ON "service_add_on_link" USING btree ("service_id","add_on_id");--> statement-breakpoint
CREATE INDEX "service_add_on_link_service_idx" ON "service_add_on_link" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "service_add_on_link_add_on_idx" ON "service_add_on_link" USING btree ("add_on_id");--> statement-breakpoint
CREATE INDEX "service_add_on_salon_idx" ON "service_add_on" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "service_category_salon_idx" ON "service_category" USING btree ("salon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_category_salon_name_key" ON "service_category" USING btree ("salon_id","name");--> statement-breakpoint
CREATE INDEX "service_salon_idx" ON "service" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "service_category_idx" ON "service" USING btree ("category_id");