CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"base_currency" char(3) DEFAULT 'USD' NOT NULL,
	"monthly_cost" bigint DEFAULT 0 NOT NULL,
	"monthly_cost_currency" char(3) DEFAULT 'USD' NOT NULL,
	"tax_rate_bps" integer DEFAULT 500 NOT NULL,
	"baseline_rate" bigint DEFAULT 0 NOT NULL,
	"target_hours" integer DEFAULT 0 NOT NULL,
	"horizon_months" integer DEFAULT 12 NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"actor" text DEFAULT 'user' NOT NULL,
	"change" jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "balance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" uuid NOT NULL,
	"as_of" date NOT NULL,
	"amount" bigint NOT NULL,
	"currency" char(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_bets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"preset" text NOT NULL,
	"name" text NOT NULL,
	"hours_per_week" numeric(6, 2) DEFAULT 0 NOT NULL,
	"max_hours" numeric(6, 2),
	"started_on" date NOT NULL,
	"caps" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"maturity_days" jsonb DEFAULT '{"attention":7,"conversation":7,"meeting":21,"win":45}'::jsonb NOT NULL,
	"cash_cost_monthly" bigint DEFAULT 0 NOT NULL,
	"cash_cost_currency" char(3) DEFAULT 'USD' NOT NULL,
	CONSTRAINT "channel_bets_id_user" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"date" date NOT NULL,
	"base" char(3) NOT NULL,
	"quote" char(3) NOT NULL,
	"rate_e6" bigint NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"channel_id" uuid,
	"platform" text,
	CONSTRAINT "income_sources_id_user" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "money_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"currency" char(3) NOT NULL,
	"is_liquid" boolean DEFAULT true NOT NULL,
	CONSTRAINT "money_accounts_id_user" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "outreach_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"channel_id" uuid NOT NULL,
	"external_id" text,
	"contact_name" text,
	"company" text,
	"url" text,
	"sent_on" date NOT NULL,
	"stage_dates" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"awaiting_reply_since" timestamp with time zone,
	"variant" text,
	"hypothesis_id" uuid,
	"value_estimate" bigint,
	"value_currency" char(3),
	"income_source_id" uuid
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"income_source_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount" bigint NOT NULL,
	"currency" char(3) NOT NULL,
	"platform_fee" bigint DEFAULT 0 NOT NULL,
	"tax_reserved" bigint,
	"certainty" text NOT NULL,
	"probability" numeric(3, 2),
	"is_recurring" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"date" date NOT NULL,
	"hours" numeric(6, 2) NOT NULL,
	"income_source_id" uuid,
	"channel_id" uuid,
	"note" text,
	CONSTRAINT "time_entries_one_target" CHECK (("time_entries"."income_source_id" is null) <> ("time_entries"."channel_id" is null))
);
--> statement-breakpoint
CREATE TABLE "weekly_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"week_start" date NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "weekly_reviews_user_week" UNIQUE("user_id","week_start")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_account_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."money_accounts"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_bets" ADD CONSTRAINT "channel_bets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_channel_fk" FOREIGN KEY ("channel_id","user_id") REFERENCES "public"."channel_bets"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "money_accounts" ADD CONSTRAINT "money_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_items" ADD CONSTRAINT "outreach_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_items" ADD CONSTRAINT "outreach_items_channel_fk" FOREIGN KEY ("channel_id","user_id") REFERENCES "public"."channel_bets"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_items" ADD CONSTRAINT "outreach_items_income_source_fk" FOREIGN KEY ("income_source_id","user_id") REFERENCES "public"."income_sources"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_income_source_fk" FOREIGN KEY ("income_source_id","user_id") REFERENCES "public"."income_sources"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_income_source_fk" FOREIGN KEY ("income_source_id","user_id") REFERENCES "public"."income_sources"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_channel_fk" FOREIGN KEY ("channel_id","user_id") REFERENCES "public"."channel_bets"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;