-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hobby" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Hobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HobbyCountry" (
    "hobbyId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "HobbyCountry_pkey" PRIMARY KEY ("hobbyId","countryId")
);

-- CreateTable
CREATE TABLE "UserHobby" (
    "userId" TEXT NOT NULL,
    "hobbyId" TEXT NOT NULL,

    CONSTRAINT "UserHobby_pkey" PRIMARY KEY ("userId","hobbyId")
);

-- CreateTable
CREATE TABLE "HobbyTranslation" (
    "id" TEXT NOT NULL,
    "hobbyId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "HobbyTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Hobby_key_key" ON "Hobby"("key");

-- CreateIndex
CREATE UNIQUE INDEX "HobbyTranslation_hobbyId_language_key" ON "HobbyTranslation"("hobbyId", "language");

-- AddForeignKey
ALTER TABLE "Hobby" ADD CONSTRAINT "Hobby_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HobbyCountry" ADD CONSTRAINT "HobbyCountry_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HobbyCountry" ADD CONSTRAINT "HobbyCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHobby" ADD CONSTRAINT "UserHobby_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHobby" ADD CONSTRAINT "UserHobby_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HobbyTranslation" ADD CONSTRAINT "HobbyTranslation_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "Hobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
