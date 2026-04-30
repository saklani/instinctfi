ALTER TABLE "orders" RENAME COLUMN "amount_lamports" TO "amount";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "tx_signature" TO "signature";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "error_message" TO "error";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "user_wallet";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "server_wallet";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "amount_usdc";