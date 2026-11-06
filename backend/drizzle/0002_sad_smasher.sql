CREATE TABLE "branch_closure" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch_hours" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"opens_at" text,
	"closes_at" text,
	"breaks" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_rate" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"salon_id" uuid NOT NULL,
	"name" text NOT NULL,
	"percent_basis_points" integer NOT NULL,
	"inclusive" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX "branch_closure_branch_idx" ON "branch_closure" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "branch_hours_branch_idx" ON "branch_hours" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "branch_hours_branch_weekday_key" ON "branch_hours" USING btree ("branch_id","weekday");--> statement-breakpoint
CREATE INDEX "tax_rate_salon_idx" ON "tax_rate" USING btree ("salon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_rate_salon_name_key" ON "tax_rate" USING btree ("salon_id","name");--> statement-breakpoint
ALTER TABLE "branch" DROP COLUMN "hours";