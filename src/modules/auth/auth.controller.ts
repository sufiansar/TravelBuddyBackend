import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import dbConfig from "../../config/db.config";
import { sendResponse } from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
export const login = catchAsync(async (req: Request, res: Response) => {
  const accessTokenExpiresIn = dbConfig.jwt.accessToken_expiresIn as string;
  const refreshTokenExpiresIn = dbConfig.jwt.refreshToken_expiresIn as string;

  const getMaxAge = (expiresIn: string) => {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    switch (unit) {
      case "y":
        return value * 365 * 24 * 60 * 60 * 1000;
      case "M":
        return value * 30 * 24 * 60 * 60 * 1000;
      case "w":
        return value * 7 * 24 * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "m":
        return value * 60 * 1000;
      case "s":
        return value * 1000;
      default:
        return 1000 * 60 * 60;
    }
  };

  const accessTokenMaxAge = getMaxAge(accessTokenExpiresIn);
  const refreshTokenMaxAge = getMaxAge(refreshTokenExpiresIn);

  const result = await AuthService.login(req.body);
  const { accessToken, refreshToken } = result;

  res.cookie("accessToken", accessToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: accessTokenMaxAge,
  });

  res.cookie("refreshToken", refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: refreshTokenMaxAge,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged in successfully!",
    data: { accessToken, refreshToken },
  });
});
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new Error("Refresh token not found.");
  }
  const getMaxAge = (expiresIn: string) => {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    switch (unit) {
      case "y":
        return value * 365 * 24 * 60 * 60 * 1000;
      case "M":
        return value * 30 * 24 * 60 * 60 * 1000;
      case "w":
        return value * 7 * 24 * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "m":
        return value * 60 * 1000;
      case "s":
        return value * 1000;
      default:
        return 1000 * 60 * 60; // default 1 hour
    }
  };
  const accessTokenMaxAge = getMaxAge(
    dbConfig.jwt.accessToken_expiresIn as string
  );
  const refreshTokenMaxAge = getMaxAge(
    dbConfig.jwt.refreshToken_expiresIn as string
  );

  const result = await AuthService.refreshToken(refreshToken);

  res.cookie("accessToken", result.accessToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: accessTokenMaxAge,
  });

  res.cookie("refreshToken", result.refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: refreshTokenMaxAge,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Access token generated successfully!",
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie("accessToken", {
    secure: true,
    sameSite: "none",
    httpOnly: true,
  });
  res.clearCookie("refreshToken", {
    secure: true,
    sameSite: "none",
    httpOnly: true,
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  const result = await AuthService.changePassword(user, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password Changed successfully",
    data: result,
  });
});
const resetPassword = catchAsync(async (req, res) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const user = req.user;

  const result = await AuthService.resetPassword(
    oldPassword,
    newPassword,
    user
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Password Reset Successfully!!!",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    res.status(401).json({
      success: false,
      message: "Access token not found. Please login first.",
    });
    return;
  }

  const result = await AuthService.getMyProfile(accessToken);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile fetched successfully",
    data: result,
  });
});

export const AuthController = {
  login,
  refreshToken,
  logout,
  resetPassword,
  getMyProfile,
  changePassword,
};
