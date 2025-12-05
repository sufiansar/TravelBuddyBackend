import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { UserService } from "./user.service";
import pick from "../../utils/pick";
import {
  UserFilterableFields,
  UserPaginationableFields,
} from "./user.constant";

const createUser = catchAsync(async (req, res) => {
  const payload = req.body;
  const file = req.file as Express.Multer.File | undefined;
  const result = await UserService.createUser(payload, file);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created Successfully!!!",
    data: result,
  });
});
const getAllUsers = catchAsync(async (req, res) => {
  const filters = pick(req.query, UserFilterableFields);
  const options = pick(req.query, UserPaginationableFields as any);

  const result = await (UserService as any).getAllUsers(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await UserService.getSingleUser(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved Successfully!!!",
    data: result,
  });
});

const getPublicProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await UserService.getPublicProfile(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Public profile retrieved successfully",
    data: result,
  });
});

const updateRoleforAdmin = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { role } = req.body;
  const result = await UserService.updateRoleforAdmin(userId, role);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin role updated Successfully!!!",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await UserService.deleteUser(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted Successfully!!!",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await UserService.deleteAdmin(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin deleted Successfully!!!",
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const payload = req.body;
  const file = req.file as Express.Multer.File | undefined;
  const result = await UserService.updateUser(userId, payload, file);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated Successfully!!!",
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  getSingleUser,
  getPublicProfile,
  updateRoleforAdmin,
  deleteUser,
  deleteAdmin,
  updateUser,
};
