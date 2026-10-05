-- AlterTable: the flag only ever preselected categories on the old expense
-- chart, which no longer exists.
ALTER TABLE "category" DROP COLUMN "isDefault";
