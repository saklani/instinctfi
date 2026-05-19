ALTER TYPE "public"."order_status" ADD VALUE 'partial' BEFORE 'failed';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_signature" text;