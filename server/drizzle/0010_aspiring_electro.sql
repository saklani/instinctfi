CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "compositions" RENAME COLUMN "weight_bps" TO "weight";--> statement-breakpoint
ALTER TABLE "vaults" RENAME COLUMN "vault_address" TO "address";--> statement-breakpoint
ALTER TABLE "vaults" RENAME COLUMN "vault_mint" TO "mint";--> statement-breakpoint
ALTER TABLE "vaults" DROP CONSTRAINT "vaults_vault_address_unique";--> statement-breakpoint
ALTER TABLE "vaults" DROP CONSTRAINT "vaults_vault_mint_unique";--> statement-breakpoint
ALTER TABLE "vaults" DROP COLUMN "deposit_fee_bps";--> statement-breakpoint
ALTER TABLE "vaults" DROP COLUMN "withdraw_fee_bps";--> statement-breakpoint
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_address_unique" UNIQUE("address");--> statement-breakpoint
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_mint_unique" UNIQUE("mint");