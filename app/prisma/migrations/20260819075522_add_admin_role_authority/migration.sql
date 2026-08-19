-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_admin_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jurisdictionScope" TEXT NOT NULL,
    "authorityId" TEXT,
    "roleLevel" TEXT NOT NULL DEFAULT 'reviewer',
    CONSTRAINT "admin_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "admin_roles_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "authorities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_admin_roles" ("id", "jurisdictionScope", "roleLevel", "userId") SELECT "id", "jurisdictionScope", "roleLevel", "userId" FROM "admin_roles";
DROP TABLE "admin_roles";
ALTER TABLE "new_admin_roles" RENAME TO "admin_roles";
CREATE UNIQUE INDEX "admin_roles_userId_key" ON "admin_roles"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

