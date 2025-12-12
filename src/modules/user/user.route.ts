import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { UserSchema } from "./user.validation";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.congig";

const router = Router();

router.get("/", UserController.getAllUsers);
router.get("/public/:id", UserController.getPublicProfile);
router.get("/:id", UserController.getSingleUser);
router.post(
  "/create-user",
  validateRequest(UserSchema),
  UserController.createUser
);
router.patch(
  "/update-role/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
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
  checkAuth(),
  multerUpload.single("profileImage"),
  UserController.updateUser
);

router.patch(
  "/update-user/:id",
  checkAuth(),
  multerUpload.single("profileImage"),
  UserController.updateUser
);

export const UserRoutes = router;
