-- CreateTable
CREATE TABLE "clothing_item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "brand" TEXT,
    "type" TEXT,
    "color" TEXT,
    "description" TEXT,
    "price" REAL,
    "datePurchased" DATETIME,
    "size" TEXT,
    "imageUrlFront" TEXT NOT NULL,
    "imageUrlBack" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "clothing_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
