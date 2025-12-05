import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { ExploreService } from "./explore.service";
import pick from "../../utils/pick";

const explorePlans = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "destination",
    "startDate",
    "endDate",
    "travelType",
    "minBudget",
    "maxBudget",
  ]);

  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await ExploreService.exploreTravelPlans(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Travel plans retrieved successfully",
    data: result,
  });
});

const exploreTravelers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["interests"]);

  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await ExploreService.exploreTravelers(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Travelers retrieved successfully",
    data: result,
  });
});

export const ExploreController = {
  explorePlans,
  exploreTravelers,
};
