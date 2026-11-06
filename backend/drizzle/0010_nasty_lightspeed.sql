CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"register_session_id" uuid,
	"method" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"provider_ref" text,
	"failure_reason" text,
	"taken_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"number" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"format" text DEFAULT 'standard' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refund" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"amount_minor" integer NOT NULL,
	"reason" text NOT NULL,
	"provider_ref" text,
	"approved_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE INDEX "payment_ticket_idx" ON "payment" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "payment_branch_created_idx" ON "payment" USING btree ("branch_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_session_idx" ON "payment" USING btree ("register_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "receipt_ticket_key" ON "receipt" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "receipt_salon_sequence_key" ON "receipt" USING btree ("salon_id","sequence");--> statement-breakpoint
CREATE INDEX "refund_payment_idx" ON "refund" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "refund_branch_created_idx" ON "refund" USING btree ("branch_id","created_at");