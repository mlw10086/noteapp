-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "banned_ips" TEXT[],
ADD COLUMN     "banned_reason" TEXT,
ADD COLUMN     "banned_until" TIMESTAMP(3),
ADD COLUMN     "last_ip_address" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
