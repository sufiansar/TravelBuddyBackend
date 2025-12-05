import { prisma } from "../../config/prisma";
import { Ioptions, paginationHelper } from "../../utils/paginationHelper";

const createReview = async (payload: any, reviewerId: string) => {
  if (payload.travelPlanId) {
    const travelPlan = await prisma.travelPlan.findUnique({
      where: { id: payload.travelPlanId },
      select: { endDate: true },
    });
    if (!travelPlan) {
      throw new Error("Associated travel plan not found");
    }
    const now = new Date();
    if (now < travelPlan.endDate) {
      throw new Error(
        "Reviews can only be created after the travel plan has ended"
      );
    }
  }

  const data = {
    rating: payload.rating,
    comment: payload.comment,
    reviewerId,
    receiverId: payload.receiverId,
    travelPlanId: payload.travelPlanId || null,
  };

  const review = await prisma.review.create({ data });

  return review;
};

const getReviewById = async (id: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      reviewer: {
        select: {
          id: true,
          fullName: true,
          username: true,
          profileImage: true,
        },
      },
      receiver: {
        select: {
          id: true,
          fullName: true,
          username: true,
          profileImage: true,
        },
      },
    },
  });

  return review;
};

const getReviewsForPlan = async (planId: string, options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where = { travelPlanId: planId };

  const [total, data] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder as "asc" | "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profileImage: true,
          },
        },
      },
    }),
  ]);

  const totalPage = Math.ceil(total / Number(limit));

  const avgResult = await prisma.review.aggregate({
    where: { travelPlanId: planId },
    _avg: { rating: true },
  });

  const averageRating = avgResult._avg?.rating ?? null;

  return {
    meta: { page, limit: Number(limit), totalPage, total, averageRating },
    data,
  };
};

const getReviewsForUser = async (userId: string, options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where = { receiverId: userId };

  const [total, data] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder as "asc" | "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profileImage: true,
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

const getAllReviews = async (options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const [total, data] = await Promise.all([
    prisma.review.count(),
    prisma.review.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder as "asc" | "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profileImage: true,
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

const updateReview = async (
  id: string,
  reviewerId: string,
  payload: any,
  isAdmin = false
) => {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) return null;
  if (!isAdmin && existing.reviewerId !== reviewerId) {
    throw new Error("Not authorized to update this review");
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      rating: payload.rating ?? existing.rating,
      comment: payload.comment ?? existing.comment,
    },
  });

  return updated;
};

const deleteReview = async (
  id: string,
  requesterId: string,
  isAdmin = false
) => {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) return null;
  if (!isAdmin && existing.reviewerId !== requesterId) {
    throw new Error("Not authorized to delete this review");
  }

  await prisma.review.delete({ where: { id } });
  return true;
};

export const ReviewService = {
  createReview,
  getReviewById,
  getReviewsForPlan,
  getReviewsForUser,
  getAllReviews,
  updateReview,
  deleteReview,
};
