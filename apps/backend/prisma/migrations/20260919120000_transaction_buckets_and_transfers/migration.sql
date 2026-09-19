-- CreateEnum
CREATE TYPE "TransactionBucket" AS ENUM ('MAIN', 'CHEQUE_REPAS', 'SAVINGS');

-- AlterTable: add the bucket column, defaulting everyone to MAIN
ALTER TABLE "transaction" ADD COLUMN "bucket" "TransactionBucket" NOT NULL DEFAULT 'MAIN';

-- Backfill: carry over the old boolean flag
UPDATE "transaction" SET "bucket" = 'CHEQUE_REPAS' WHERE "isChequeRepas" = true;

-- AlterTable: drop the now-redundant boolean
ALTER TABLE "transaction" DROP COLUMN "isChequeRepas";

-- AlterTable: add the transfer correlation id
ALTER TABLE "transaction" ADD COLUMN "transferGroupId" TEXT;

-- CreateIndex
CREATE INDEX "transaction_transferGroupId_idx" ON "transaction"("transferGroupId");
