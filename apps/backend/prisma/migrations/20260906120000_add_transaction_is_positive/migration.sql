-- AlterTable
ALTER TABLE "transaction" ADD COLUMN "isPositive" BOOLEAN NOT NULL DEFAULT false;

-- Backfill from any currently-linked category (a transaction's categories are
-- always all-income or all-expense, so any one of them tells us the sign).
UPDATE "transaction" t
SET "isPositive" = true
WHERE EXISTS (
  SELECT 1
  FROM "_CategoryToTransaction" ct
  JOIN "category" c ON c.id = ct."A"
  WHERE ct."B" = t.id AND c."isPositive" = true
);
