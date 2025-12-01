import dbConfig from "../../config/db.config";
import { prisma } from "../../config/prisma";
import { User, UserRole } from "../../generated/prisma/client";

import bcrypt from "bcryptjs";
import { IUser } from "./user.interface";
import AppError from "../../errorHelper/ApiError";

const createUser = async (user: IUser, file: any) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });
  if (isUserExist) {
    throw new Error("User with this email already exists");
  }

  const hashPassword = await bcrypt.hash(
    user.password,
    Number(dbConfig.bcryptJs_salt)
  );
  const createdUser = await prisma.user.create({
    data: {
      fullName: user.fullName,
      email: user.email,
      password: hashPassword,
    },
  });

  return createdUser;
};

const createAdmin = async (user: IUser, file: any) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
  });
  if (isUserExist) {
    throw new Error("User with this email already exists");
  }
  if (!user.role) {
    throw new Error("Role is required for admin creation");
  }
  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, "Only SUPER_ADMIN can create an admin");
  }

  const hashPassword = await bcrypt.hash(
    user.password,
    Number(dbConfig.bcryptJs_salt)
  );
  const createdAdmin = await prisma.user.create({
    data: {
      fullName: user.fullName,
      email: user.email,
      password: hashPassword,
      role: UserRole.ADMIN,
    },
  });

  return createdAdmin;
};

const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return null;
};

const deleteAdmin = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, "Only SUPER_ADMIN can delete an admin");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return null;
};

const updateUser = async (
  userId: string,
  userData: Partial<IUser>,
  file: any
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...userData,
    },
  });

  return updatedUser;
};

export const UserService = {
  createUser,
  createAdmin,
  deleteUser,
  deleteAdmin,
  updateUser,
};
