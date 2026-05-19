ALTER TABLE "positions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settlements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wallet_balances" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "positions" CASCADE;--> statement-breakpoint
DROP TABLE "settlements" CASCADE;--> statement-breakpoint
DROP TABLE "wallet_balances" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_signature_unique";--> statement-breakpoint
ALTER TABLE "vaults" DROP CONSTRAINT "vaults_privy_wallet_id_unique";--> statement-breakpoint
ALTER TABLE "vaults" DROP CONSTRAINT "vaults_wallet_address_unique";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_settlement_id_settlements_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shares";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "signature";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "destination_address";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "settlement_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "fill_nav";--> statement-breakpoint
ALTER TABLE "vaults" DROP COLUMN "privy_wallet_id";--> statement-breakpoint
ALTER TABLE "vaults" DROP COLUMN "wallet_address";--> statement-breakpoint
DROP TYPE "public"."settlement_status";