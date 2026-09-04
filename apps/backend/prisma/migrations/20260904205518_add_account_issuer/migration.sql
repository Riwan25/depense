ALTER TABLE "account" ADD COLUMN "issuer" TEXT NOT NULL DEFAULT 'credential';
ALTER TABLE "account" ALTER COLUMN "issuer" DROP DEFAULT;
CREATE UNIQUE INDEX "account_issuer_accountId_key" ON "account"("issuer", "accountId");
