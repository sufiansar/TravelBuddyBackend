import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { PaymentService } from "./payment.service";
import { Request, Response } from "express";
import AppError from "../../errorHelper/ApiError";

const createSession = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { plan } = req.body as { plan: "MONTHLY" | "YEARLY" };
  if (!plan) {
    res.status(400).json({ success: false, message: "plan is required" });
    return;
  }

  const session = await PaymentService.createCheckoutSession(user.id, plan);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stripe checkout session created",
    data: { sessionId: session.id, url: session.url },
  });
});

const verifySession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    throw new AppError(httpStatus.BAD_REQUEST, "sessionId is required");
  }
  const result = await PaymentService.verifyAndProcessSession(sessionId);

  sendResponse(res, {
    statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
    success: result.success,
    message: result.message,
    data: result.success
      ? { subscription: result.subscription, user: result.user }
      : result.session,
  });
});

export const PaymentController = {
  createSession,
  verifySession,
};
