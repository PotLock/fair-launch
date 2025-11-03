CREATE TYPE "public"."transaction_action" AS ENUM('BUY', 'SELL', 'BRIDGE', 'DEPLOY');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "action" SET DATA TYPE "public"."transaction_action" USING "action"::"public"."transaction_action";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."transaction_status";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "status" SET DATA TYPE "public"."transaction_status" USING "status"::"public"."transaction_status";