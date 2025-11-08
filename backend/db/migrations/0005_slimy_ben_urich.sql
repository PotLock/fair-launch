CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" varchar(64) NOT NULL,
	"tx_hash" varchar(128),
	"action" varchar(10) NOT NULL,
	"base_token" varchar(64) NOT NULL,
	"quote_token" varchar(64) NOT NULL,
	"amount_in" numeric(30, 10) NOT NULL,
	"amount_out" numeric(30, 10) NOT NULL,
	"price_per_token" numeric(30, 10),
	"slippage_bps" numeric(10, 2) DEFAULT '50',
	"fee" numeric(30, 10) DEFAULT '0',
	"fee_token" varchar(64) DEFAULT 'SOL',
	"status" varchar(20) DEFAULT 'pending',
	"chain" varchar(32) DEFAULT 'solana',
	"pool_address" varchar(128),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
