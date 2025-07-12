ALTER TABLE "tokens" RENAME COLUMN "address" TO "mint_address";--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "owner" varchar(255);