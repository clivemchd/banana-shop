-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "scheduledBillingCycle" TEXT,
ADD COLUMN     "scheduledPlanId" TEXT,
ADD COLUMN     "scheduledStartDate" TIMESTAMP(3);
