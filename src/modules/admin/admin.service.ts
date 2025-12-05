import { prisma } from "../../config/prisma";
import { Prisma, UserRole, UserStatus } from "../../generated/prisma/client";
import { paginationHelper, Ioptions } from "../../utils/paginationHelper";
import AppError from "../../errorHelper/ApiError";

// Admin: List all users with filters
const getAllUsersAdmin = async (filters: any = {}, options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const andConditions: Prisma.UserWhereInput[] = [];

  if (filters.role) {
    andConditions.push({ role: filters.role });
  }
  if (filters.userStatus) {
    andConditions.push({ userStatus: filters.userStatus });
  }
  if (filters.verifiedBadge !== undefined) {
    andConditions.push({ verifiedBadge: filters.verifiedBadge });
  }
  if (filters.searchTerm) {
    andConditions.push({
      OR: [
        { fullName: { contains: filters.searchTerm, mode: "insensitive" } },
        { email: { contains: filters.searchTerm, mode: "insensitive" } },
        { username: { contains: filters.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [total, data] = await Promise.all([
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
        email: true,
        role: true,
        userStatus: true,
        verifiedBadge: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const totalPage = Math.ceil(total / Number(limit));

  return {
    meta: { page, limit: Number(limit), totalPage, total },
    data,
  };
};

// Admin: Ban/unban user
const toggleUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    throw new AppError(403, "Cannot change status of Super Admin");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { userStatus: status },
  });

  return updated;
};

// Admin: List all travel plans
const getAllTravelPlansAdmin = async (
  filters: any = {},
  options: Ioptions = {}
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const andConditions: Prisma.TravelPlanWhereInput[] = [];

  if (filters.destination) {
    andConditions.push({
      destination: { contains: filters.destination, mode: "insensitive" },
    });
  }
  if (filters.travelType) {
    andConditions.push({ travelType: filters.travelType });
  }
  if (filters.isPublic) {
    andConditions.push({ isPublic: filters.isPublic });
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
            email: true,
            userStatus: true,
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

// Admin: Delete travel plan
const deleteTravelPlanAdmin = async (planId: string) => {
  const plan = await prisma.travelPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    throw new AppError(404, "Travel plan not found");
  }

  await prisma.travelPlan.delete({ where: { id: planId } });
  return true;
};

// Admin: Get all payments
const getAllPaymentsAdmin = async (
  filters: any = {},
  options: Ioptions = {}
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const andConditions: Prisma.PaymentWhereInput[] = [];

  if (filters.status) {
    andConditions.push({ status: filters.status });
  }
  if (filters.userId) {
    andConditions.push({ userId: filters.userId });
  }

  const where: Prisma.PaymentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [total, data] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        subscription: true,
      },
    }),
  ]);

  const totalPage = Math.ceil(total / Number(limit));

  return {
    meta: { page, limit: Number(limit), totalPage, total },
    data,
  };
};

// Admin: Get all subscriptions
const getAllSubscriptionsAdmin = async (
  filters: any = {},
  options: Ioptions = {}
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const andConditions: Prisma.SubscriptionWhereInput[] = [];

  if (filters.plan) {
    andConditions.push({ plan: filters.plan });
  }
  if (filters.isActive !== undefined) {
    andConditions.push({ isActive: filters.isActive });
  }

  const where: Prisma.SubscriptionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [total, data] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
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

// Admin: Get platform stats
const getPlatformStats = async () => {
  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    totalPlans,
    totalPayments,
    activeSubscriptions,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { userStatus: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { userStatus: UserStatus.BANNED } }),
    prisma.travelPlan.count(),
    prisma.payment.count(),
    prisma.subscription.count({ where: { isActive: true } }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      banned: bannedUsers,
    },
    travelPlans: {
      total: totalPlans,
    },
    payments: {
      total: totalPayments,
      totalRevenue: totalRevenue._sum?.amount ?? 0,
    },
    subscriptions: {
      active: activeSubscriptions,
    },
  };
};

export const AdminService = {
  getAllUsersAdmin,
  toggleUserStatus,
  getAllTravelPlansAdmin,
  deleteTravelPlanAdmin,
  getAllPaymentsAdmin,
  getAllSubscriptionsAdmin,
  getPlatformStats,
};
