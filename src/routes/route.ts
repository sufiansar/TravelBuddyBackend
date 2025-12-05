import express from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRouters } from "../modules/auth/auth.route";
import { TravelPlanRoutes } from "../modules/travelPlan/travelPlan.route";
import { TravelMatchRoutes } from "../modules/travelMatch/travleMatch.route";
import { MeetupRoutes } from "../modules/meetup/meetup.route";
import { PostRoutes } from "../modules/post/post.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { ExploreRoutes } from "../modules/explore/explore.route";
import { AdminRoutes } from "../modules/admin/admin.route";
const router = express.Router();
const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/travelPlans",
    route: TravelPlanRoutes,
  },
  {
    path: "/travelMatches",
    route: TravelMatchRoutes,
  },
  {
    path: "/meetups",
    route: MeetupRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/posts",
    route: PostRoutes,
  },
  {
    path: "/payments",
    route: PaymentRoutes,
  },
  {
    path: "/explore",
    route: ExploreRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
