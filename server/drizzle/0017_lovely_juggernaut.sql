ALTER TABLE "orders" ADD COLUMN "signature" text;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "connected_address" text;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "connected_client_type" text;--> statement-breakpoint
ALTER TABLE "wallets" DROP COLUMN "sol_sponsored_at";--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_signature_unique" UNIQUE("signature");