import dbConfig from "../../config/db.config";
import { prisma } from "../../config/prisma";
import {
  User,
  UserRole,
  Prisma,
  PlanVisibility,
} from "../../generated/prisma/client";
import { paginationHelper, Ioptions } from "../../utils/paginationHelper";
import { UserSearchAbleFields } from "./user.constant";

import bcrypt from "bcryptjs";
import { IUser } from "./user.interface";
import AppError from "../../errorHelper/ApiError";

const createUser = async (user: IUser, file: any) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });
  if (isUserExist) {
    throw new Error("User with this email already exists");
  }

  const hashPassword = await bcrypt.hash(
    user.password,
    Number(dbConfig.bcryptJs_salt)
  );
  const createdUser = await prisma.user.create({
    data: {
      fullName: user.fullName,
      email: user.email,
      password: hashPassword,
    },
  });

  return createdUser;
};

const updateRoleforAdmin = async (
  userId: string,
  role: UserRole,
  loggedInUser: any
) => {
  // Check logged-in user's role
  if (loggedInUser.role === UserRole.USER) {
    throw new AppError(403, "Only SUPER_ADMIN and Admin can update admin role");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return updatedUser;
};

const getAllUsers = async (filters: any = {}, options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = filters;
  const andConditions: Prisma.UserWhereInput[] = [];
  if (searchTerm) {
    andConditions.push({
      OR: UserSearchAbleFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const where: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const data = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.user.count({ where });
  const totalPage = Math.ceil(total / Number(limit));

  return { meta: { page, limit, total, totalPage }, data };
};

const getSingleUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

const getPublicProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // upcoming public travel plans
  const upcomingPlans = await prisma.travelPlan.findMany({
    where: {
      userId,
      isPublic: PlanVisibility.PUBLIC,
      endDate: { gte: new Date() },
    },
    orderBy: { startDate: "asc" },
    take: 5,
  });

  // recent reviews (received)
  const recentReviews = await prisma.review.findMany({
    where: { receiverId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      reviewer: {
        select: { id: true, fullName: true, profileImage: true },
      },
    },
  });

  // average rating
  const avg = await prisma.review.aggregate({
    where: { receiverId: userId },
    _avg: { rating: true },
  });

  const averageRating = avg._avg?.rating ?? null;

  return {
    user,
    upcomingPlans,
    recentReviews,
    averageRating,
  };
};

const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return null;
};

const deleteAdmin = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    throw new AppError(403, "Cannot delete Super Admin");
  }

  if (user.role === UserRole.USER) {
    throw new AppError(403, "Admin And Super Admin can delete an admin");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return null;
};

const updateUser = async (
  userId: string,
  userData: Partial<IUser>,
  file: any
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const profileImage = file?.path || userData.profileImage || user.profileImage;

  const parseStringArray = (value: any): string[] | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...userData,
      interests: parseStringArray(userData.interests),
      visitedCountries: parseStringArray(userData.visitedCountries),
      profileImage,
    },
  });

  return updatedUser;
};

export const UserService = {
  createUser,
  getAllUsers,
  getSingleUser,
  getPublicProfile,
  updateRoleforAdmin,
  deleteUser,
  deleteAdmin,
  updateUser,
};
