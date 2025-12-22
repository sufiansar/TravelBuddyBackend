import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { TravelPlanService } from "./travelPlan.service";
import pick from "../../utils/pick";
import {
  TravelPlanpaginationableFields,
  TravleFilterableFields,
} from "./travlePlanConstant";
import { Request, Response } from "express";

const createTravelPlan = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const file = req.file as Express.Multer.File | undefined;
  if (!userId) throw new Error("Unauthorized: User not logged in");
  const payload = req.body;
  const result = await TravelPlanService.createTravelPlan(
    payload,
    userId,
    file
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Travel plan created successfully!",
    data: result,
  });
});

const getMyPlans = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const filters = pick(req.query, TravleFilterableFields);
  const options = pick(req.query, TravelPlanpaginationableFields);

  if (!userId) throw new Error("Unauthorized: User not logged in");

  const result = await TravelPlanService.getMyPlans(userId, filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My travel plans retrieved successfully",
    data: result,
  });
});

const getAllTravelPlans = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, TravleFilterableFields);
  const options = pick(req.query, TravelPlanpaginationableFields);

  const result = await TravelPlanService.getAllTravelPlans(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Travel plans retrieved successfully!",
    data: result,
  });
});

const getSingleTravelPlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await TravelPlanService.getSingleTravelPlan(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Single travel plan retrieved successfully!",
    data: result,
  });
});

const updateTravelPlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const result = await TravelPlanService.updateTravelPlan(id, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Travel plan updated successfully!",
    data: result,
  });
});

const deleteTravelPlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await TravelPlanService.deleteTravelPlan(
    id,
    (req as any).user
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Travel plan deleted successfully!",
    data: result,
  });
});

const requestToJoin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const { message } = req.body;

  const result = await TravelPlanService.requestToJoin(id, user, message);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Request created successfully!",
    data: result,
  });
});

const getRequestsForOwner = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const result = await TravelPlanService.getRequestsForOwner(id, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Requests retrieved successfully!",
    data: result,
  });
});

const respondToRequest = catchAsync(async (req: Request, res: Response) => {
  const { id, requestId } = req.params;
  const user = req.user;
  const { action } = req.body;

  const result = await TravelPlanService.respondToRequest(
    id,
    requestId,
    user,
    action
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Request updated successfully!",
    data: result,
  });
});

export const TravelPlanController = {
  createTravelPlan,
  getAllTravelPlans,
  getMyPlans,
  getSingleTravelPlan,
  updateTravelPlan,
  deleteTravelPlan,
  requestToJoin,
  getRequestsForOwner,
  respondToRequest,
};
