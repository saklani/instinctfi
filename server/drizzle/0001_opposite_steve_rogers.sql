ALTER TABLE "stocks" DROP CONSTRAINT "stocks_mint_unique";--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "mint";--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_address_unique" UNIQUE("address");