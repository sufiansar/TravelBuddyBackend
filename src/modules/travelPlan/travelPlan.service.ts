import { prisma } from "../../config/prisma";
import { ITravelPlan } from "./travelPlan.interface";
import { Ioptions, paginationHelper } from "../../utils/paginationHelper";
import { Prisma, RequestStatus, UserRole } from "../../generated/prisma/client";
import { TravleSearchAbleFields } from "./travlePlanConstant";

export const createTravelPlan = async (
  payload: ITravelPlan,
  userId: string,
  file: Express.Multer.File | undefined
) => {
  if (!userId) throw new Error("User ID missing from request");

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userExists) throw new Error("User not found");

  const imageUrl = file?.path || payload.imageUrl || undefined;

  const travelPlan = await prisma.travelPlan.create({
    data: {
      destination: payload.destination,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      minBudget: Number(payload.minBudget),
      maxBudget: Number(payload.maxBudget),
      travelType: payload.travelType,
      description: payload.description,
      isPublic: payload.isPublic ?? "PUBLIC",
      userId: userId,
      imageUrl: imageUrl,
    },
  });

  return travelPlan;
};

const getMyPlans = async (userId: string, filter: any, options: Ioptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where: Prisma.TravelPlanWhereInput = {
    userId,
    ...filter,
  };

  const data = await prisma.travelPlan.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    take: limit,
    skip,
    include: {
      matches: { include: { matchedUser: true } },
      requests: { include: { requester: true } },
      reviews: true,
      user: true,
    },
  });

  const total = await prisma.travelPlan.count({ where });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};

const getAllTravelPlans = async (filters: any, options: Ioptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, minBudget, maxBudget, ...filterData } = filters;

  const andConditions: Prisma.TravelPlanWhereInput[] = [];

  // Search term
  if (searchTerm) {
    andConditions.push({
      OR: TravleSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Numeric budget filter
  if (minBudget || maxBudget) {
    if (minBudget) {
      andConditions.push({ minBudget: { gte: Number(minBudget) } });
    }
    if (maxBudget) {
      andConditions.push({ maxBudget: { lte: Number(maxBudget) } });
    }
  }

  // Exact match filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: filterData[key],
      })),
    });
  }

  const whereConditions: Prisma.TravelPlanWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const travelPlans = await prisma.travelPlan.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: true,
    },
  });

  const total = await prisma.travelPlan.count({
    where: whereConditions,
  });
  const totalPage = Math.ceil(total / Number(limit));

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: travelPlans,
  };
};

const getSingleTravelPlan = async (id: string) => {
  const plan = await prisma.travelPlan.findUnique({
    where: { id },
    include: {
      user: true,
      matches: { include: { matchedUser: true } },
      requests: { include: { requester: true } },
      reviews: true,
    },
  });

  if (!plan) throw new Error("Travel plan not found");

  return plan;
};

const updateTravelPlan = async (id: string, payload: Partial<ITravelPlan>) => {
  const isUserExist = await prisma.travelPlan.findUnique({ where: { id } });
  if (!isUserExist) throw new Error("Travel plan not found");
  const existing = await prisma.travelPlan.findUnique({ where: { id } });
  if (!existing) throw new Error("Travel plan not found");
  const updated = await prisma.travelPlan.update({
    where: { id },
    data: {
      ...payload,
      startDate: payload.startDate
        ? new Date(payload.startDate)
        : existing.startDate,
      endDate: payload.endDate ? new Date(payload.endDate) : existing.endDate,
    },
  });
  return updated;
};

const deleteTravelPlan = async (id: string, user: any) => {
  const existing = await prisma.travelPlan.findUnique({ where: { id } });
  if (!existing) throw new Error("Travel plan not found");
  if (existing.userId !== user.id && user.role !== "ADMIN")
    throw new Error("Not authorized to delete this plan");

  const deleted = await prisma.travelPlan.delete({ where: { id } });
  return deleted;
};
const requestToJoin = async (
  travelPlanId: string,
  user: any,
  message?: string
) => {
  const plan = await prisma.travelPlan.findUnique({
    where: { id: travelPlanId },
  });
  if (!plan) throw new Error("Travel plan not found");

  const existing = await prisma.travelPlanRequest.findUnique({
    where: {
      travelPlanId_requesterId: { travelPlanId, requesterId: user.id },
    } as any,
  });
  if (existing) throw new Error("Request already submitted");

  const req = await prisma.travelPlanRequest.create({
    data: { travelPlanId, requesterId: user.id, message },
  });
  return req;
};

const getRequestsForOwner = async (travelPlanId: string, user: any) => {
  const plan = await prisma.travelPlan.findUnique({
    where: { id: travelPlanId },
  });
  if (!plan) throw new Error("Travel plan not found");
  if (plan.userId !== user.id && user.role !== "ADMIN")
    throw new Error("Not authorized");

  const requests = await prisma.travelPlanRequest.findMany({
    where: { travelPlanId },
    include: { requester: true },
  });
  return requests;
};
const respondToRequest = async (
  travelPlanId: string,
  requestId: string,
  user: any,
  action: string
) => {
  const plan = await prisma.travelPlan.findUnique({
    where: { id: travelPlanId },
  });
  if (!plan) throw new Error("Travel plan not found");
  if (plan.userId !== user.id && user.role !== "ADMIN")
    throw new Error("Not authorized");

  const req = await prisma.travelPlanRequest.findUnique({
    where: { id: requestId },
  });
  if (!req) throw new Error("Request not found");

  const validActions: (keyof typeof RequestStatus)[] = [
    "PENDING",
    "ACCEPTED",
    "REJECTED",
  ];
  if (!validActions.includes(action as keyof typeof RequestStatus)) {
    throw new Error(
      "Invalid action. Must be one of: PENDING, ACCEPTED, REJECTED"
    );
  }

  const updated = await prisma.travelPlanRequest.update({
    where: { id: requestId },
    data: { status: action as RequestStatus },
  });

  return updated;
};
export const TravelPlanService = {
  createTravelPlan,
  getMyPlans,
  getAllTravelPlans,
  getSingleTravelPlan,
  updateTravelPlan,
  deleteTravelPlan,
  requestToJoin,
  getRequestsForOwner,
  respondToRequest,
};
