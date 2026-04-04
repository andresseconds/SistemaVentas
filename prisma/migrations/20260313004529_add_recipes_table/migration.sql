/*
  Warnings:

  - You are about to drop the column `quatity` on the `RecipeItem` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `RecipeItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RecipeItem" DROP COLUMN "quatity",
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL;
