import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post("/create-session", checkAuth(), PaymentController.createSession);
router.get("/verify-session/:sessionId", PaymentController.verifySession);

export const PaymentRoutes = router;
