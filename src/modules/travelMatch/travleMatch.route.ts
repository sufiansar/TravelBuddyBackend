import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { TravelMatchController } from "./travelMatch.controller";

const router = Router();
router.post(
  "/:id/matches/generate",
  checkAuth(),
  TravelMatchController.generateMatches
);
router.get("/", checkAuth(), TravelMatchController.getAllMatches);
router.get(
  "/:id/matches",
  checkAuth(),
  TravelMatchController.getMatchesForPlan
);
router.get("/matches/me", checkAuth(), TravelMatchController.getMatchesForUser);
router.delete("/matches/:id", checkAuth(), TravelMatchController.deleteMatch);

export const TravelMatchRoutes = router;
