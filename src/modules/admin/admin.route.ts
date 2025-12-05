import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { UserRole } from "../../generated/prisma/enums";
import { AdminController } from "./admin.controller";

const router = Router();

router.get(
  "/users",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AdminController.getAllUsers
);

router.patch(
  "/users/:userId/status",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AdminController.toggleUserStatus
);

router.get(
  "/travel-plans",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AdminController.getAllTravelPlans
);

router.delete(
  "/travel-plans/:planId",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AdminController.deleteTravelPlan
);

router.get(
  "/payments",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AdminController.getAllPayments
);

router.get(
  "/subscriptions",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AdminController.getAllSubscriptions
);

router.get(
  "/stats",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AdminController.getPlatformStats
);

export const AdminRoutes = router;
