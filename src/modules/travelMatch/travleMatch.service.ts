import { prisma } from "../../config/prisma";
import { UserRole } from "../../generated/prisma/enums";
import { paginationHelper, Ioptions } from "../../utils/paginationHelper";
import { Prisma } from "../../generated/prisma/client";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const generateMatches = async (travelPlanId: string, user: any) => {
  const results = await prisma.$transaction(async (tx) => {
    const plan = await tx.travelPlan.findUnique({
      where: { id: travelPlanId },
      include: { user: true },
    });
    if (!plan) throw new Error("Travel plan not found");
    // if (plan.userId !== user.id && user.role !== UserRole.ADMIN)
    //   throw new Error("Not authorized to generate matches for this plan");

    const candidates = await tx.travelPlan.findMany({
      where: {
        id: { not: travelPlanId },
        userId: { not: plan.userId },
        destination: { contains: plan.destination, mode: "insensitive" },
        isPublic: "PUBLIC",
        AND: [
          { startDate: { lte: plan.endDate } },
          { endDate: { gte: plan.startDate } },
        ],
      },
      include: { user: true },
    });

    const matches: any[] = [];

    for (const candidate of candidates) {
      const overlapStart =
        plan.startDate > candidate.startDate
          ? plan.startDate
          : candidate.startDate;
      const overlapEnd =
        plan.endDate < candidate.endDate ? plan.endDate : candidate.endDate;
      let overlapDays = 0;
      if (overlapEnd >= overlapStart) {
        overlapDays = Math.ceil((+overlapEnd - +overlapStart) / MS_PER_DAY) + 1;
      }

      const ownerInterests = plan.user?.interests || [];
      const candidateInterests = candidate.user?.interests || [];
      const commonInterests = ownerInterests.filter((i: string) =>
        candidateInterests.includes(i)
      );

      const score = overlapDays * 10 + commonInterests.length * 5;

      const updateRes = await tx.travelMatch.updateMany({
        where: { travelPlanId, matchedUserId: candidate.userId },
        data: { matchScore: score },
      });

      let matchRecord;
      if (updateRes.count && updateRes.count > 0) {
        matchRecord = await tx.travelMatch.findFirst({
          where: { travelPlanId, matchedUserId: candidate.userId },
        });
      } else {
        matchRecord = await tx.travelMatch.create({
          data: {
            matchScore: score,
            travelPlanId,
            matchedUserId: candidate.userId,
          },
        });
      }

      const full = await tx.travelMatch.findUnique({
        where: { id: matchRecord?.id },
        include: { matchedUser: true },
      });
      matches.push(full);
    }

    return matches;
  });

  return results;
};

const getMatchesForPlan = async (travelPlanId: string, user: any) => {
  const plan = await prisma.travelPlan.findUnique({
    where: { id: travelPlanId },
  });
  if (!plan) throw new Error("Travel plan not found");

  const matches = await prisma.travelMatch.findMany({
    where: { travelPlanId },
    include: { matchedUser: true },
  });
  return matches;
};

const getMatchesForUser = async (userId: string) => {
  const matches = await prisma.travelMatch.findMany({
    where: { matchedUserId: userId },
    include: { travelPlan: { include: { user: true } } },
  });
  return matches;
};

const deleteMatch = async (matchId: string, user: any) => {
  const match = await prisma.travelMatch.findUnique({
    where: { id: matchId },
    include: { travelPlan: true },
  });
  if (!match) throw new Error("Match not found");
  if (match.travelPlan.userId !== user.id && user.role !== UserRole.ADMIN)
    throw new Error("Not authorized to delete this match");

  await prisma.travelMatch.delete({ where: { id: matchId } });
  return { success: true };
};

const getAllMatches = async (filters: any = {}, options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = filters;
  const andConditions: Prisma.TravelMatchWhereInput[] = [];
  if (searchTerm) {
    // allow search by matched user's name or travel plan destination
    andConditions.push({
      OR: [
        {
          matchedUser: {
            fullName: { contains: searchTerm, mode: "insensitive" },
          },
        },
        {
          travelPlan: {
            destination: { contains: searchTerm, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const where: Prisma.TravelMatchWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const data = await prisma.travelMatch.findMany({
    where,
    include: { matchedUser: true, travelPlan: { include: { user: true } } },
    skip,
    take: limit,
    // orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.travelMatch.count({ where });
  const totalPage = Math.ceil(total / Number(limit));

  return { meta: { page, limit, total, totalPage }, data };
};

export const TravelMatchService = {
  generateMatches,
  getMatchesForPlan,
  getMatchesForUser,
  deleteMatch,
  getAllMatches,
};
