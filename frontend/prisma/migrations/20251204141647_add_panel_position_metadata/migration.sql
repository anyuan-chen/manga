-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "filePath" TEXT;

-- AlterTable
ALTER TABLE "Panel" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "pageNumber" INTEGER,
ADD COLUMN     "width" INTEGER,
ADD COLUMN     "x" INTEGER,
ADD COLUMN     "y" INTEGER;
