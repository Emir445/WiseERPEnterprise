/*
  Warnings:

  - You are about to drop the column `auditLogId` on the `inventory_balances` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `inventory_balances` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `inventory_balances` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `inventory_balances` table. All the data in the column will be lost.
  - You are about to drop the column `auditLogId` on the `inventory_movements` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `inventory_movements` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `inventory_movements` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `inventory_movements` table. All the data in the column will be lost.
  - You are about to drop the column `auditLogId` on the `purchase_items` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `purchase_items` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `purchase_items` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `purchase_items` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `purchase_items` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `purchase_items` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FinancialEntryType" AS ENUM ('RECEIVABLE', 'PAYABLE');

-- CreateEnum
CREATE TYPE "FinancialEntryStatus" AS ENUM ('OPEN', 'PARTIAL', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'PIX', 'CARD', 'BANK_TRANSFER', 'BOLETO', 'OTHER');

-- DropForeignKey
ALTER TABLE "inventory_balances" DROP CONSTRAINT "inventory_balances_auditLogId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_balances" DROP CONSTRAINT "inventory_balances_customerId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_balances" DROP CONSTRAINT "inventory_balances_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_balances" DROP CONSTRAINT "inventory_balances_userId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_auditLogId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_customerId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_userId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_items" DROP CONSTRAINT "purchase_items_auditLogId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_items" DROP CONSTRAINT "purchase_items_branchId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_items" DROP CONSTRAINT "purchase_items_companyId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_items" DROP CONSTRAINT "purchase_items_customerId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_items" DROP CONSTRAINT "purchase_items_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_items" DROP CONSTRAINT "purchase_items_userId_fkey";

-- AlterTable
ALTER TABLE "inventory_balances" DROP COLUMN "auditLogId",
DROP COLUMN "customerId",
DROP COLUMN "supplierId",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "inventory_movements" DROP COLUMN "auditLogId",
DROP COLUMN "customerId",
DROP COLUMN "supplierId",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "purchase_items" DROP COLUMN "auditLogId",
DROP COLUMN "branchId",
DROP COLUMN "companyId",
DROP COLUMN "customerId",
DROP COLUMN "supplierId",
DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "financial_entries" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "type" "FinancialEntryType" NOT NULL,
    "status" "FinancialEntryStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,4) NOT NULL,
    "paid_amount" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3) NOT NULL,
    "settled_at" TIMESTAMP(3),
    "payment_method" "PaymentMethod",
    "customer_id" UUID,
    "supplier_id" UUID,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_entries_company_id_type_status_idx" ON "financial_entries"("company_id", "type", "status");

-- CreateIndex
CREATE INDEX "financial_entries_company_id_due_date_idx" ON "financial_entries"("company_id", "due_date");

-- CreateIndex
CREATE INDEX "financial_entries_customer_id_idx" ON "financial_entries"("customer_id");

-- CreateIndex
CREATE INDEX "financial_entries_supplier_id_idx" ON "financial_entries"("supplier_id");

-- CreateIndex
CREATE INDEX "financial_entries_reference_type_reference_id_idx" ON "financial_entries"("reference_type", "reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_entries_company_id_reference_type_reference_id_ty_key" ON "financial_entries"("company_id", "reference_type", "reference_id", "type");

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
