import { Router } from "express";
import { TravelPlanController } from "./travelPlan.controller";
import checkAuth from "../../middleware/checkAuth";

const router = Router();

router.post(
  "/create-travel-plan",
  checkAuth(),
  TravelPlanController.createTravelPlan
);

router.get("/my-plans", checkAuth(), TravelPlanController.getMyPlans);
router.get("/", TravelPlanController.getAllTravelPlans);
router.get("/:id", TravelPlanController.getSingleTravelPlan);
router.patch("/:id", checkAuth(), TravelPlanController.updateTravelPlan);
router.delete("/:id", checkAuth(), TravelPlanController.deleteTravelPlan);
router.post("/:id/request", checkAuth(), TravelPlanController.requestToJoin);
router.get(
  "/:id/requests",
  checkAuth(),
  TravelPlanController.getRequestsForOwner
);
router.post(
  "/:id/requests/:requestId/respond",
  checkAuth(),
  TravelPlanController.respondToRequest
);

export const TravelPlanRoutes = router;
