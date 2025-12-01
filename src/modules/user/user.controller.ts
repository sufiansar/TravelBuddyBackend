import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { UserService } from "./user.service";

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

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const file = req.file as Express.Multer.File | undefined;
  const result = await UserService.createAdmin(payload, file);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Admin created Successfully!!!",
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
  createAdmin,
  deleteUser,
  deleteAdmin,
  updateUser,
};
