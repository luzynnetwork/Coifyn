CREATE TABLE "register_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"opened_by" uuid NOT NULL,
	"opening_float_minor" integer NOT NULL,
	"closing_count_minor" integer,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ticket_discount" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" integer NOT NULL,
	"reason" text NOT NULL,
	"approved_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_line" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"ref_id" uuid NOT NULL,
	"stylist_id" uuid,
	"description" text NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"line_total_minor" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"register_session_id" uuid,
	"source" text DEFAULT 'walk_in' NOT NULL,
	"source_id" uuid,
	"customer_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"tax_basis_points" integer DEFAULT 0 NOT NULL,
	"tax_inclusive" boolean DEFAULT false NOT NULL,
	"subtotal_minor" integer DEFAULT 0 NOT NULL,
	"discount_minor" integer DEFAULT 0 NOT NULL,
	"tax_minor" integer DEFAULT 0 NOT NULL,
	"total_minor" integer DEFAULT 0 NOT NULL,
	"paid_at" timestamp with time zone,
	"void_reason" text,
	"voided_by" uuid,
	"voided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "register_session_branch_idx" ON "register_session" USING btree ("branch_id","opened_at");--> statement-breakpoint
CREATE UNIQUE INDEX "register_session_one_open_key" ON "register_session" USING btree ("branch_id") WHERE closed_at is null and deleted_at is null;--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_discount_ticket_key" ON "ticket_discount" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_line_ticket_idx" ON "ticket_line" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_line_stylist_idx" ON "ticket_line" USING btree ("stylist_id");--> statement-breakpoint
CREATE INDEX "ticket_branch_created_idx" ON "ticket" USING btree ("branch_id","created_at");--> statement-breakpoint
CREATE INDEX "ticket_salon_status_idx" ON "ticket" USING btree ("salon_id","status");--> statement-breakpoint
CREATE INDEX "ticket_customer_idx" ON "ticket" USING btree ("customer_id");