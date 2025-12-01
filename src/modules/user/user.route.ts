import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { UserSchema } from "./user.validation";

const router = Router();

router.post(
  "/create-user",
  validateRequest(UserSchema),
  UserController.createUser
);

export const UserRoutes = router;
