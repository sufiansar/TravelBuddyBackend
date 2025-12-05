import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { ReviewService } from "./review.service";
import pick from "../../utils/pick";
import { UserPaginationableFields } from "../user/user.constant";

const create = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;
  const review = await ReviewService.createReview(payload, user.id);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: review,
  });
});

const getForPlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const options = pick(req.query, UserPaginationableFields);
  const result = await ReviewService.getReviewsForPlan(id, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews fetched for plan",
    data: result.data,
    meta: result.meta,
  });
});

const getForUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const options = pick(req.query, UserPaginationableFields);
  const result = await ReviewService.getReviewsForUser(id, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews fetched for user",
    data: result.data,
    meta: result.meta,
  });
});

const getSingle = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const review = await ReviewService.getReviewById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review fetched",
    data: review,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const payload = req.body;
  const updated = await ReviewService.updateReview(
    id,
    user.id,
    payload,
    user.role === "admin"
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review updated",
    data: updated,
  });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const deleted = await ReviewService.deleteReview(
    id,
    user.id,
    user.role === "admin"
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted",
    data: deleted,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, UserPaginationableFields);
  const result = await ReviewService.getAllReviews(options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews fetched",
    data: result.data,
    meta: result.meta,
  });
});

export const ReviewController = {
  create,
  getForPlan,
  getForUser,
  getSingle,
  update,
  remove,
  getAll,
};
