/*
  Warnings:

  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PasswordResetToken";
PRAGMA foreign_keys=on;
