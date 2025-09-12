ALTER TABLE "token_allocations" DROP COLUMN "vesting_enabled";--> statement-breakpoint
ALTER TABLE "tokens" DROP COLUMN "admin_controls_enabled";--> statement-breakpoint
ALTER TABLE "tokens" DROP COLUMN "schedule_launch_enabled";--> statement-breakpoint
ALTER TABLE "tokens" DROP COLUMN "revoke_mint_authority_enabled";--> statement-breakpoint
ALTER TABLE "tokens" DROP COLUMN "revoke_freeze_authority_enabled";