import { prisma } from "../../config/prisma";
import { UserStatus } from "../../generated/prisma/enums";
import ApiError from "../../errorHelper/ApiError";
import httpStatus from "http-status-codes";
import dbConfig from "../../config/db.config";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../../utils/jwt";

interface LoginPayload {
  email: string;
  password: string;
}
const login = async (payload: LoginPayload) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new Error("Invalid email or password!");
  }

  if (userData.userStatus !== UserStatus.ACTIVE) {
    throw new Error("User is not active.");
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new Error("Invalid email or password!");
  }

  const accessToken = generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    dbConfig.jwt.accessToken_secret as string,
    dbConfig.jwt.accessToken_expiresIn as string
  );

  const refreshToken = generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    dbConfig.jwt.refreshToken_secret as string,
    dbConfig.jwt.refreshToken_expiresIn as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  let decodedData: any;
  try {
    decodedData = verifyToken(
      token,
      dbConfig.jwt.refreshToken_secret as string
    );
  } catch (err) {
    throw new Error("You are not authorized!");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: { email: decodedData.email },
  });

  if (userData.userStatus !== UserStatus.ACTIVE) {
    throw new Error("User is not active.");
  }

  const accessToken = generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    dbConfig.jwt.accessToken_secret as string,
    dbConfig.jwt.accessToken_expiresIn as string
  );

  const newRefreshToken = generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    dbConfig.jwt.refreshToken_secret as string,
    dbConfig.jwt.refreshToken_expiresIn as string
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

const resetPassword = async (
  oldPassword: string,
  newPassword: string,
  user: any
) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const ispassword = await bcrypt.compare(oldPassword, isUserExist.password);

  if (!ispassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Old Password is Wrong Please Give Correct Password"
    );
  }
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedNewPassword;
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword },
  });
  return hashedNewPassword;
};

const changePassword = async (user: any, payload: any) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
      userStatus: UserStatus.ACTIVE,
    },
  });
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.oldPassword,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new Error("Password incorrect!");
  }

  const hashedPassword: string = await bcrypt.hash(
    payload.newPassword,
    Number(dbConfig.bcryptJs_salt)
  );

  await prisma.user.update({
    where: {
      email: userData.email,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: "Password changed successfully!",
  };
};

const getMyProfile = async (accessToken: string) => {
  const decodedData: any = verifyToken(
    accessToken,
    dbConfig.jwt.accessToken_secret as string
  );

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData.email,
      userStatus: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      bio: true,
      profileImage: true,
      gender: true,
      currentLocation: true,
      verifiedBadge: true,
      interests: true,
      visitedCountries: true,
      isPublic: true,
      travelPlans: true,
      userStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return userData;
};
const resetADPassword = async (
  token: string,
  payload: { id: string; password: string }
) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      id: payload.id,
      userStatus: UserStatus.ACTIVE,
    },
  });

  const isValidToken = verifyToken(
    token,
    dbConfig.jwt.accessToken_secret as string
  );
  if (!isValidToken) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
  }
  const password = await bcrypt.hash(
    payload.password,
    Number(dbConfig.bcryptJs_salt)
  );
  await prisma.user.update({
    where: {
      id: payload.id,
    },
    data: {
      password,
    },
  });
};
export const AuthService = {
  login,
  refreshToken,
  resetPassword,
  getMyProfile,
  changePassword,
  resetADPassword,
};
