ALTER TABLE "user_wallets" RENAME TO "wallets";--> statement-breakpoint
ALTER TABLE "wallets" DROP CONSTRAINT "user_wallets_user_id_unique";--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id");