CREATE TYPE "public"."order_status" AS ENUM('pending', 'funded', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('deposit', 'withdraw');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"user_wallet" text NOT NULL,
	"server_wallet" text NOT NULL,
	"vault_id" uuid NOT NULL,
	"type" "order_type" NOT NULL,
	"amount_usdc" numeric NOT NULL,
	"amount_lamports" text,
	"shares" numeric,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"tx_signature" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"vault_id" uuid NOT NULL,
	"shares" numeric DEFAULT '0' NOT NULL,
	"cost_basis_usdc" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"ticker" text NOT NULL,
	"symbol" text NOT NULL,
	"description" text,
	"mint" text NOT NULL,
	"pyth_account" text,
	"decimals" integer DEFAULT 8 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stocks_mint_unique" UNIQUE("mint")
);
--> statement-breakpoint
CREATE TABLE "user_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"vault_address" text NOT NULL,
	"vault_mint" text NOT NULL,
	"composition" jsonb NOT NULL,
	"deposit_fee_bps" integer DEFAULT 0 NOT NULL,
	"withdraw_fee_bps" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vaults_vault_address_unique" UNIQUE("vault_address"),
	CONSTRAINT "vaults_vault_mint_unique" UNIQUE("vault_mint")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE no action ON UPDATE no action;