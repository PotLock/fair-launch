CREATE TYPE "public"."launchpad" AS ENUM('potlaunch', 'cookedpad');--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "launchpad" "launchpad" DEFAULT 'potlaunch' NOT NULL;--> statement-breakpoint
ALTER TABLE "tokens" ADD COLUMN "tags" text[] DEFAULT ARRAY[]::text[];