/*
  Warnings:

  - Added the required column `handle` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "lineUserId" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'citizen',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_users" ("createdAt", "displayName", "id", "lineUserId", "userType") SELECT "createdAt", "displayName", "id", "lineUserId", "userType" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_handle_key" ON "users"("handle");
CREATE UNIQUE INDEX "users_lineUserId_key" ON "users"("lineUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
