-- CreateTable
CREATE TABLE "_CategoryHierarchy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryHierarchy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryHierarchy_B_index" ON "_CategoryHierarchy"("B");

-- AddForeignKey
ALTER TABLE "_CategoryHierarchy" ADD CONSTRAINT "_CategoryHierarchy_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryHierarchy" ADD CONSTRAINT "_CategoryHierarchy_B_fkey" FOREIGN KEY ("B") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
