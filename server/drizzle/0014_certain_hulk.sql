CREATE TYPE "public"."order_status" AS ENUM('pending', 'funded', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('deposit', 'withdraw');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('open', 'executing', 'filled', 'failed');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"vault_id" uuid NOT NULL,
	"type" "order_type" NOT NULL,
	"amount" numeric NOT NULL,
	"shares" numeric,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"signature" text,
	"destination_address" text,
	"settlement_id" uuid,
	"fill_nav" numeric,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_signature_unique" UNIQUE("signature")
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
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid NOT NULL,
	"strike_at" timestamp NOT NULL,
	"nav_per_share" numeric,
	"total_deposits_usdc" numeric DEFAULT '0' NOT NULL,
	"total_redemptions_usdc" numeric DEFAULT '0' NOT NULL,
	"status" "settlement_status" DEFAULT 'open' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vaults" ADD COLUMN "privy_wallet_id" text;--> statement-breakpoint
ALTER TABLE "vaults" ADD COLUMN "wallet_address" text;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "privy_wallet_id" text;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "sol_sponsored_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_settlement_id_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_vault_position" ON "positions" USING btree ("user_id","vault_id");--> statement-breakpoint
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_privy_wallet_id_unique" UNIQUE("privy_wallet_id");--> statement-breakpoint
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_wallet_address_unique" UNIQUE("wallet_address");