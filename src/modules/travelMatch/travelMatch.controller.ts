import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { TravelMatchService } from "./travleMatch.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import pick from "../../utils/pick";

const generateMatches = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  const result = await (TravelMatchService as any).generateMatches(id, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Matches generated successfully!",
    data: result,
  });
});

const getMatchesForPlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const result = await (TravelMatchService as any).getMatchesForPlan(id, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Matches retrieved successfully!",
    data: result,
  });
});

const getMatchesForUser = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await (TravelMatchService as any).getMatchesForUser(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User matches retrieved successfully!",
    data: result,
  });
});

const getAllMatches = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "travelPlanId",
    "matchedUserId",
    "searchTerm",
  ]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await (TravelMatchService as any).getAllMatches(
    filters,
    options
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Matches fetched",
    data: result,
  });
});

const deleteMatch = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // this is match id
  const user = (req as any).user;

  const result = await (TravelMatchService as any).deleteMatch(id, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Match deleted successfully!",
    data: result,
  });
});

export const TravelMatchController = {
  generateMatches,
  getMatchesForPlan,
  getMatchesForUser,
  deleteMatch,
  getAllMatches,
};
