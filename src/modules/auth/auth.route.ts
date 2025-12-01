import { Router } from "express";
import { AuthController } from "./auth.controller";
import { UserRole } from "../../generated/prisma/enums";
import checkAuth from "../../middleware/checkAuth";

const router = Router();

router.get(
  "/me",
  checkAuth(...Object.values(UserRole)),
  AuthController.getMyProfile
);

router.post("/login", AuthController.login);
router.post(
  "/change-password",
  checkAuth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER),
  AuthController.changePassword
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logout);
router.post(
  "/reset-password",
  checkAuth(...Object.values(UserRole)),
  AuthController.resetPassword
);

export const AuthRouters = router;
