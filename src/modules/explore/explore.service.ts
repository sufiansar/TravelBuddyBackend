import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";
import { paginationHelper, Ioptions } from "../../utils/paginationHelper";

interface ExploreFilters {
  destination?: string;
  startDate?: string;
  endDate?: string;
  interests?: string[];
  travelType?: string;
  minBudget?: number;
  maxBudget?: number;
}

const exploreTravelPlans = async (
  filters: ExploreFilters = {},
  options: Ioptions = {}
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const andConditions: Prisma.TravelPlanWhereInput[] = [];
  andConditions.push({ isPublic: "PUBLIC" });
  andConditions.push({
    endDate: { gte: new Date() },
  });

  if (filters.destination) {
    andConditions.push({
      destination: {
        contains: filters.destination,
        mode: "insensitive",
      },
    });
  }
  if (filters.startDate) {
    andConditions.push({
      startDate: { gte: new Date(filters.startDate) },
    });
  }
  if (filters.endDate) {
    andConditions.push({
      endDate: { lte: new Date(filters.endDate) },
    });
  }
  if (filters.travelType) {
    andConditions.push({
      travelType: filters.travelType as any,
    });
  }
  if (filters.minBudget !== undefined) {
    andConditions.push({
      minBudget: { gte: filters.minBudget },
    });
  }
  if (filters.maxBudget !== undefined) {
    andConditions.push({
      maxBudget: { lte: filters.maxBudget },
    });
  }
  const where: Prisma.TravelPlanWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const [total, data] = await Promise.all([
    prisma.travelPlan.count({ where }),
    prisma.travelPlan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profileImage: true,
            verifiedBadge: true,
            interests: true,
          },
        },
      },
    }),
  ]);

  const totalPage = Math.ceil(total / Number(limit));

  return {
    meta: { page, limit: Number(limit), totalPage, total },
    data,
  };
};

const exploreTravelers = async (
  filters: ExploreFilters = {},
  options: Ioptions = {}
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const andConditions: Prisma.UserWhereInput[] = [];
  andConditions.push({ isPublic: true });
  if (filters.interests && filters.interests.length > 0) {
    andConditions.push({
      interests: {
        hasSome: filters.interests,
      },
    });
  }

  const where: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        fullName: true,
        username: true,
        profileImage: true,
        bio: true,
        interests: true,
        visitedCountries: true,
        currentLocation: true,
        verifiedBadge: true,
        createdAt: true,
      },
    }),
  ]);

  const data = await Promise.all(
    users.map(async (user) => {
      const [upcomingPlans, avgRating] = await Promise.all([
        prisma.travelPlan.count({
          where: {
            userId: user.id,
            isPublic: "PUBLIC",
            endDate: { gte: new Date() },
          },
        }),
        prisma.review.aggregate({
          where: { receiverId: user.id },
          _avg: { rating: true },
        }),
      ]);

      return {
        ...user,
        upcomingPlansCount: upcomingPlans,
        averageRating: avgRating._avg?.rating ?? null,
      };
    })
  );

  const totalPage = Math.ceil(total / Number(limit));

  return {
    meta: { page, limit: Number(limit), totalPage, total },
    data,
  };
};

export const ExploreService = {
  exploreTravelPlans,
  exploreTravelers,
};
