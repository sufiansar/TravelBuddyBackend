import Stripe from "stripe";
import dbConfig from "../../config/db.config";
import { prisma } from "../../config/prisma";

const stripe = new Stripe(dbConfig.stripe.stripe_secret_key || "", {
  //   apiVersion: "2022-11-15",
});

export type Plan = "MONTHLY" | "YEARLY";

const PRICE_MONTHLY = Number(process.env.PRICE_MONTHLY_CENTS) || 5000; // $50 default
const PRICE_YEARLY = Number(process.env.PRICE_YEARLY_CENTS) || 50000; // $500 default

const getPlanAmount = (plan: Plan) =>
  plan === "YEARLY" ? PRICE_YEARLY : PRICE_MONTHLY;

const createCheckoutSession = async (userId: string, plan: Plan) => {
  const amount = getPlanAmount(plan);
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `TravelBuddy Subscription (${plan.toLowerCase()})`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      plan,
    },
    success_url: `${clientUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/payments/cancel`,
  });

  return session;
};

// const handleCheckoutSession = async (session: Stripe.Checkout.Session) => {
//   const metadata: any = session.metadata || {};
//   const userId = metadata.userId as string | undefined;
//   const plan = (metadata.plan as Plan) || ("MONTHLY" as Plan);

//   if (!userId) {
//     throw new Error("Session missing userId metadata");
//   }

//   const amount = (session.amount_total || getPlanAmount(plan)) as number;
//   const transactionId = session.id as string;

//   // Idempotency: if a payment with this transactionId already exists, return early
//   const existingPayment = await prisma.payment.findUnique({
//     where: { transactionId },
//   });
//   if (existingPayment) {
//     // find related subscription and return it
//     const subscription = await prisma.subscription.findUnique({
//       where: { id: existingPayment.subscriptionId || "" },
//     });
//     return { subscription };
//   }

//   const startDate = new Date();
//   const endDate = new Date(startDate);
//   if (plan === "YEARLY") {
//     endDate.setFullYear(endDate.getFullYear() + 1);
//   } else {
//     endDate.setDate(endDate.getDate() + 30);
//   }

//   const result = await prisma.$transaction(async (tx) => {
//     const subscription = await tx.subscription.upsert({
//       where: { userId },
//       update: {
//         plan,
//         startDate,
//         endDate,
//         isActive: true,
//         price: amount,
//       },
//       create: {
//         plan,
//         startDate,
//         endDate,
//         isActive: true,
//         price: amount,
//         userId,
//       },
//     });

//     const payment = await tx.payment.create({
//       data: {
//         amount,
//         status: "SUCCESS",
//         transactionId,
//         purpose: `Subscription ${plan}`,
//         userId,
//         subscriptionId: subscription.id,
//       },
//     });

//     const user = await tx.user.update({
//       where: { id: userId },
//       data: { verifiedBadge: true },
//     });

//     return { subscription, payment, user };
//   });

//   return { subscription: result.subscription };
// };

const handleCheckoutSession = async (session: Stripe.Checkout.Session) => {
  console.log("=== handleCheckoutSession START ===");
  console.log("Session ID:", session.id);
  console.log("Metadata:", session.metadata);

  const metadata: any = session.metadata || {};
  const userId = metadata.userId as string | undefined;
  const plan = (metadata.plan as Plan) || ("MONTHLY" as Plan);

  if (!userId) {
    console.error("ERROR: Missing userId in metadata");
    throw new Error("Session missing userId metadata");
  }

  console.log(`Processing for userId: ${userId}, plan: ${plan}`);

  const amount = (session.amount_total || getPlanAmount(plan)) as number;
  const transactionId = session.id as string;

  // Idempotency check
  const existingPayment = await prisma.payment.findUnique({
    where: { transactionId },
  });
  if (existingPayment) {
    console.log("Payment already exists, returning existing subscription");
    const subscription = await prisma.subscription.findUnique({
      where: { id: existingPayment.subscriptionId || "" },
    });
    return { subscription };
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  if (plan === "YEARLY") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setDate(endDate.getDate() + 30);
  }

  console.log("Creating/updating subscription...");
  console.log(`Start Date: ${startDate}, End Date: ${endDate}`);

  try {
    const result = await prisma.$transaction(async (tx) => {
      console.log("Transaction started");

      const subscription = await tx.subscription.upsert({
        where: { userId },
        update: {
          plan,
          startDate,
          endDate,
          isActive: true,
          price: amount,
        },
        create: {
          plan,
          startDate,
          endDate,
          isActive: true,
          price: amount,
          userId,
        },
      });
      console.log("Subscription created/updated:", subscription.id);

      const payment = await tx.payment.create({
        data: {
          amount,
          status: "SUCCESS",
          transactionId,
          purpose: `Subscription ${plan}`,
          userId,
          subscriptionId: subscription.id,
        },
      });
      console.log("Payment created:", payment.id);

      const userBefore = await tx.user.findUnique({
        where: { id: userId },
        select: { verifiedBadge: true },
      });
      console.log("User before update:", userBefore);

      const user = await tx.user.update({
        where: { id: userId },
        data: { verifiedBadge: true },
      });
      console.log("User after update:", {
        id: user.id,
        verifiedBadge: user.verifiedBadge,
        email: user.email,
      });

      return { subscription, payment, user };
    });

    console.log("=== handleCheckoutSession END ===");
    console.log("Transaction result:", {
      subscriptionId: result.subscription?.id,
      paymentId: result.payment?.id,
      userId: result.user?.id,
      userVerifiedBadge: result.user?.verifiedBadge,
    });
    return { subscription: result.subscription, user: result.user };
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
};
const verifyAndProcessSession = async (sessionId: string) => {
  console.log("=== verifyAndProcessSession START ===");
  console.log("Session ID:", sessionId);

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  console.log("Retrieved session:", {
    id: session.id,
    payment_status: session.payment_status,
    metadata: session.metadata,
  });

  if (session.payment_status !== "paid") {
    console.warn(
      "Session payment_status is not 'paid':",
      session.payment_status
    );

    // Return the session URL so frontend can redirect user back to complete payment
    return {
      success: false,
      message:
        session.payment_status === "unpaid"
          ? "Payment not completed. Please complete the checkout to activate your subscription."
          : `Payment status: ${session.payment_status}`,
      paymentStatus: session.payment_status,
      checkoutUrl: session.url,
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
      },
    };
  }

  // Process the session (same logic as webhook)
  const result = await handleCheckoutSession(session);

  console.log("=== verifyAndProcessSession END ===");
  console.log("Final result:", {
    subscriptionId: result.subscription?.id,
    userId: result.user?.id,
    verifiedBadge: result.user?.verifiedBadge,
  });
  return {
    success: true,
    message: "Session verified and processed",
    subscription: result.subscription,
    user: result.user,
  };
};

export const PaymentService = {
  createCheckoutSession,
  handleCheckoutSession,
  verifyAndProcessSession,
  stripe,
};
