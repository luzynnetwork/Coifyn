CREATE TABLE "salon_customer" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"notes" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_visit_at" timestamp with time zone,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"total_spend_minor" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "salon_customer_salon_idx" ON "salon_customer" USING btree ("salon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salon_customer_salon_phone_key" ON "salon_customer" USING btree ("salon_id","phone");