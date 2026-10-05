-- CreateEnum
CREATE TYPE "DashboardWidgetType" AS ENUM ('CATEGORY_PIE', 'BUCKET_TREND', 'CATEGORY_STAT', 'YEARLY_BAR');

-- CreateEnum
CREATE TYPE "DashboardWidgetWidth" AS ENUM ('HALF', 'FULL');

-- CreateTable
CREATE TABLE "dashboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widget" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DashboardWidgetType" NOT NULL,
    "width" "DashboardWidgetWidth" NOT NULL DEFAULT 'FULL',
    "position" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dashboard_userId_idx" ON "dashboard"("userId");

-- CreateIndex
CREATE INDEX "dashboard_widget_dashboardId_idx" ON "dashboard_widget"("dashboardId");

-- AddForeignKey
ALTER TABLE "dashboard" ADD CONSTRAINT "dashboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widget" ADD CONSTRAINT "dashboard_widget_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
