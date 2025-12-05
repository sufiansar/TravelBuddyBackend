import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { ReviewController } from "./review.controller";

const router = Router();

router.post("/", checkAuth(), ReviewController.create);
router.get("/", checkAuth("admin"), ReviewController.getAll);
router.get("/plan/:id", ReviewController.getForPlan);
router.get("/user/:id", ReviewController.getForUser);
router.get("/:id", ReviewController.getSingle);
router.patch("/:id", checkAuth(), ReviewController.update);
router.delete("/:id", checkAuth(), ReviewController.remove);

export const ReviewRoutes = router;
