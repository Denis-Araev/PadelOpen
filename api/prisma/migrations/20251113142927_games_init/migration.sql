/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `isRating` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `levelMax` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `levelMin` on the `Game` table. All the data in the column will be lost.
  - The `status` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `createdById` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endsAt` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Made the column `clubId` on table `Game` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GameVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('GOING', 'NOT_GOING', 'MAYBE', 'WAITLIST');

-- CreateEnum
CREATE TYPE "ParticipationRole" AS ENUM ('PLAYER', 'RESERVE', 'ORGANIZER');

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_clubId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "creatorId",
DROP COLUMN "isRating",
DROP COLUMN "levelMax",
DROP COLUMN "levelMin",
ADD COLUMN     "courtName" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "levelNote" TEXT,
ADD COLUMN     "maxPlayers" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Tallinn',
ADD COLUMN     "title" TEXT,
ADD COLUMN     "visibility" "GameVisibility" NOT NULL DEFAULT 'PUBLIC',
ALTER COLUMN "clubId" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED';

-- CreateTable
CREATE TABLE "GameParticipant" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'GOING',
    "role" "ParticipationRole" NOT NULL DEFAULT 'PLAYER',
    "note" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameParticipant_gameId_status_role_idx" ON "GameParticipant"("gameId", "status", "role");

-- CreateIndex
CREATE UNIQUE INDEX "GameParticipant_gameId_userId_key" ON "GameParticipant"("gameId", "userId");

-- CreateIndex
CREATE INDEX "Game_clubId_startsAt_idx" ON "Game"("clubId", "startsAt");

-- CreateIndex
CREATE INDEX "Game_status_startsAt_idx" ON "Game"("status", "startsAt");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
