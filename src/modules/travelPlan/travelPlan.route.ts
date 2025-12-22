import { Router } from "express";
import { TravelPlanController } from "./travelPlan.controller";
import checkAuth from "../../middleware/checkAuth";
import { multerUpload } from "../../config/multer.congig";

const router = Router();

router.post(
  "/create-travel-plan",
  checkAuth(),
  multerUpload.single("imageUrl"),
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
