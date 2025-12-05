import { Request, Response } from "express";
import dbConfig from "../../config/db.config";
import { PaymentService } from "./payment.service";
import Stripe from "stripe";
import { prisma } from "../../config/prisma";

const webhookSecret = dbConfig.stripe.stripe_webhook_secret;
const stripe = PaymentService.stripe;

const processedEvents = new Set<string>();

export const webhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const rawBody = Buffer.isBuffer(req.body)
    ? (req.body as Buffer)
    : ((req as any).rawBody as Buffer | undefined);

  if (!sig || !rawBody) {
    console.error("Missing signature or raw body");
    return res.status(400).send("Webhook error: missing signature or raw body");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret || "");
    console.log(`Received event: ${event.type} (${event.id})`);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err);
    return res
      .status(400)
      .send(`Webhook signature verification failed: ${err?.message || err}`);
  }

  // Basic idempotency
  if (processedEvents.has(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`);
    return res.json({ received: true, idempotent: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Processing checkout.session.completed:", {
        sessionId: session.id,
        metadata: session.metadata,
        paymentStatus: session.payment_status,
      });

      // Add try-catch specifically for handleCheckoutSession
      try {
        const result = await PaymentService.handleCheckoutSession(session);
        console.log("PaymentService result:", result);

        // Verify the update worked
        if (session.metadata?.userId) {
          const user = await prisma.user.findUnique({
            where: { id: session.metadata.userId },
            select: { id: true, verifiedBadge: true, email: true },
          });
          console.log("User after payment processing:", user);
        }
      } catch (error) {
        console.error("Error in handleCheckoutSession:", error);
        throw error; // Re-throw to trigger 500 response
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.warn("Stripe payment_intent.payment_failed", intent.id);

      const possibleTxn =
        (intent.metadata &&
          (intent.metadata.session_id || intent.metadata.checkout_session)) ||
        intent.id;

      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.payment.findUnique({
            where: { transactionId: possibleTxn },
          });
          if (existing) {
            await tx.payment.update({
              where: { id: existing.id },
              data: { status: "FAILED" },
            });
            console.log("Updated payment status to FAILED:", existing.id);
          }
        });
      } catch (e) {
        console.error("Error handling failed payment intent transaction", e);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn("Stripe invoice.payment_failed", invoice.id);

      const possibleTxn =
        (invoice.metadata &&
          (invoice.metadata.session_id || invoice.metadata.checkout_session)) ||
        invoice.id;

      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.payment.findUnique({
            where: { transactionId: possibleTxn },
          });
          if (existing) {
            await tx.payment.update({
              where: { id: existing.id },
              data: { status: "FAILED" },
            });
            console.log(
              "Updated invoice payment status to FAILED:",
              existing.id
            );
          }
        });
      } catch (e) {
        console.error("Error handling failed invoice transaction", e);
      }
    }

    // Mark event processed in-memory
    processedEvents.add(event.id);
    console.log(`Event ${event.id} processed successfully`);
  } catch (err) {
    console.error("webhook processing error:", err);
    return res.status(500).send("webhook handler error");
  }

  res.json({ received: true });
};
