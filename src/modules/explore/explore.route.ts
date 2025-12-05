import { Router } from "express";
import { ExploreController } from "./explore.controller";

const router = Router();

router.get("/plans", ExploreController.explorePlans);
router.get("/travelers", ExploreController.exploreTravelers);

export const ExploreRoutes = router;
