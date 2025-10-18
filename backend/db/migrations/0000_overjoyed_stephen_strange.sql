CREATE TABLE "base_fee_params" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dbc_config_id" uuid NOT NULL,
	"base_fee_mode" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "build_curve_params" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dbc_config_id" uuid NOT NULL,
	"build_curve_mode" integer NOT NULL,
	"percentage_supply_on_migration" numeric(5, 2),
	"migration_quote_threshold" numeric(20, 9),
	"initial_market_cap" numeric(20, 9),
	"migration_market_cap" numeric(20, 9),
	"liquidity_weights" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dbc_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"quote_mint" varchar(44) NOT NULL,
	"build_curve_mode" integer NOT NULL,
	"total_token_supply" numeric(20, 9) NOT NULL,
	"migration_option" integer NOT NULL,
	"token_base_decimal" integer NOT NULL,
	"token_quote_decimal" integer NOT NULL,
	"dynamic_fee_enabled" boolean DEFAULT true NOT NULL,
	"activation_type" integer NOT NULL,
	"collect_fee_mode" integer NOT NULL,
	"migration_fee_option" integer NOT NULL,
	"token_type" integer NOT NULL,
	"partner_lp_percentage" numeric(5, 2) NOT NULL,
	"creator_lp_percentage" numeric(5, 2) NOT NULL,
	"partner_locked_lp_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"creator_locked_lp_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"creator_trading_fee_percentage" numeric(5, 2) NOT NULL,
	"leftover" numeric(20, 9) DEFAULT '0' NOT NULL,
	"token_update_authority" integer NOT NULL,
	"leftover_receiver" varchar(44) NOT NULL,
	"fee_claimer" varchar(44) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_scheduler_params" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_fee_params_id" uuid NOT NULL,
	"starting_fee_bps" integer NOT NULL,
	"ending_fee_bps" integer NOT NULL,
	"number_of_period" integer DEFAULT 0 NOT NULL,
	"total_duration" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locked_vesting_params" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dbc_config_id" uuid NOT NULL,
	"total_locked_vesting_amount" numeric(20, 9) DEFAULT '0' NOT NULL,
	"number_of_vesting_period" integer DEFAULT 0 NOT NULL,
	"cliff_unlock_amount" numeric(20, 9) DEFAULT '0' NOT NULL,
	"total_vesting_duration" integer DEFAULT 0 NOT NULL,
	"cliff_duration_from_migration_time" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migrated_pool_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dbc_config_id" uuid NOT NULL,
	"collect_fee_mode" integer NOT NULL,
	"dynamic_fee" integer NOT NULL,
	"pool_fee_bps" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migration_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dbc_config_id" uuid NOT NULL,
	"fee_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"creator_fee_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limiter_params" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_fee_params_id" uuid NOT NULL,
	"base_fee_bps" integer NOT NULL,
	"fee_increment_bps" integer NOT NULL,
	"reference_amount" numeric(20, 9) DEFAULT '0' NOT NULL,
	"max_limiter_duration" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"token_uri" text,
	"banner_uri" text,
	"website" text,
	"twitter" text,
	"telegram" text,
	"metadata_uri" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"pool_address" varchar(44),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"transaction_hash" varchar(88) NOT NULL,
	"operation" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"amount" numeric(20, 9),
	"fee" numeric(20, 9),
	"from_address" varchar(44),
	"to_address" varchar(44),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mint_address" varchar(44),
	"name" varchar(255) NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"description" text,
	"total_supply" numeric(20, 9) NOT NULL,
	"decimals" integer DEFAULT 6 NOT NULL,
	"owner" varchar(44) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_mint_address_unique" UNIQUE("mint_address")
);
--> statement-breakpoint
ALTER TABLE "base_fee_params" ADD CONSTRAINT "base_fee_params_dbc_config_id_dbc_configs_id_fk" FOREIGN KEY ("dbc_config_id") REFERENCES "public"."dbc_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_curve_params" ADD CONSTRAINT "build_curve_params_dbc_config_id_dbc_configs_id_fk" FOREIGN KEY ("dbc_config_id") REFERENCES "public"."dbc_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dbc_configs" ADD CONSTRAINT "dbc_configs_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_scheduler_params" ADD CONSTRAINT "fee_scheduler_params_base_fee_params_id_base_fee_params_id_fk" FOREIGN KEY ("base_fee_params_id") REFERENCES "public"."base_fee_params"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locked_vesting_params" ADD CONSTRAINT "locked_vesting_params_dbc_config_id_dbc_configs_id_fk" FOREIGN KEY ("dbc_config_id") REFERENCES "public"."dbc_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migrated_pool_fees" ADD CONSTRAINT "migrated_pool_fees_dbc_config_id_dbc_configs_id_fk" FOREIGN KEY ("dbc_config_id") REFERENCES "public"."dbc_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration_fees" ADD CONSTRAINT "migration_fees_dbc_config_id_dbc_configs_id_fk" FOREIGN KEY ("dbc_config_id") REFERENCES "public"."dbc_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_limiter_params" ADD CONSTRAINT "rate_limiter_params_base_fee_params_id_base_fee_params_id_fk" FOREIGN KEY ("base_fee_params_id") REFERENCES "public"."base_fee_params"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_metadata" ADD CONSTRAINT "token_metadata_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_pools" ADD CONSTRAINT "token_pools_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_token_id_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE cascade ON UPDATE no action;