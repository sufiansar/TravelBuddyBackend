import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";

import { generateToken, verifyToken } from "./jwt";
import dbConfig from "../config/db.config";
import AppError from "../errorHelper/ApiError";
import { prisma } from "../config/prisma";

export const createUserTokens = (user: Partial<IUser>) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    dbConfig.jwt.accessToken_secret as string,
    dbConfig.jwt.accessToken_expiresIn as string
  );

  const refreshToken = generateToken(
    jwtPayload,
    dbConfig.jwt.refreshToken_secret as string,
    dbConfig.jwt.refreshToken_expiresIn as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string
) => {
  const verifiedRefreshToken = verifyToken(
    refreshToken,
    dbConfig.jwt.refreshToken_secret as string
  ) as JwtPayload;

  const isUserExist = await prisma.user.findUnique({
    where: { email: verifiedRefreshToken.email },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
  }
  if (
    isUserExist.isActive === UserStatus.BLOCKED ||
    isUserExist.isActive === UserStatus.INACTIVE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `User is ${isUserExist.isActive}`
    );
  }
  if (isUserExist.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    dbConfig.jwt.accessToken_secret as string,
    dbConfig.jwt.accessToken_expiresIn as string
  );

  return accessToken;
};
