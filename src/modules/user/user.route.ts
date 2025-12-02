import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { UserSchema } from "./user.validation";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/prisma/enums";

const router = Router();

router.get("/", UserController.getAllUsers);
router.get("/:id", UserController.getSingleUser);
router.post(
  "/create-user",
  validateRequest(UserSchema),
  UserController.createUser
);
router.patch(
  "/update-role/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(UserSchema),
  UserController.updateRoleforAdmin
);
router.delete(
  "/delete-user/:id",
  checkAuth(...Object.values(UserRole)),
  UserController.deleteUser
);
router.delete(
  "/delete-admin/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.deleteAdmin
);
router.patch(
  "/update-user/:id",
  validateRequest(UserSchema),
  UserController.updateUser
);

export const UserRoutes = router;
