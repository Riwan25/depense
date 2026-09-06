-- CreateTable
CREATE TABLE "category_group" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mainCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToTransaction" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToTransaction_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CategoryGroupMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryGroupMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_group_mainCategoryId_key" ON "category_group"("mainCategoryId");

-- CreateIndex
CREATE INDEX "category_group_userId_idx" ON "category_group"("userId");

-- CreateIndex
CREATE INDEX "_CategoryToTransaction_B_index" ON "_CategoryToTransaction"("B");

-- CreateIndex
CREATE INDEX "_CategoryGroupMembers_B_index" ON "_CategoryGroupMembers"("B");

-- AddForeignKey
ALTER TABLE "category_group" ADD CONSTRAINT "category_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_group" ADD CONSTRAINT "category_group_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToTransaction" ADD CONSTRAINT "_CategoryToTransaction_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToTransaction" ADD CONSTRAINT "_CategoryToTransaction_B_fkey" FOREIGN KEY ("B") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryGroupMembers" ADD CONSTRAINT "_CategoryGroupMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryGroupMembers" ADD CONSTRAINT "_CategoryGroupMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "category_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: carry over each transaction's existing single category into the new join table
INSERT INTO "_CategoryToTransaction" ("A", "B")
SELECT "categoryId", "id" FROM "transaction" WHERE "categoryId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "_CategoryHierarchy" DROP CONSTRAINT "_CategoryHierarchy_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryHierarchy" DROP CONSTRAINT "_CategoryHierarchy_B_fkey";

-- DropForeignKey
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_categoryId_fkey";

-- DropIndex
DROP INDEX "transaction_categoryId_idx";

-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "_CategoryHierarchy";
