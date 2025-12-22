-- DropForeignKey
ALTER TABLE "postComments" DROP CONSTRAINT "postComments_postId_fkey";

-- DropForeignKey
ALTER TABLE "postReactions" DROP CONSTRAINT "postReactions_postId_fkey";

-- DropForeignKey
ALTER TABLE "postSaves" DROP CONSTRAINT "postSaves_postId_fkey";

-- DropForeignKey
ALTER TABLE "postShares" DROP CONSTRAINT "postShares_postId_fkey";

-- AddForeignKey
ALTER TABLE "postReactions" ADD CONSTRAINT "postReactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postSaves" ADD CONSTRAINT "postSaves_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postShares" ADD CONSTRAINT "postShares_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
