import express from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRouters } from "../modules/auth/auth.route";
import { TravelPlanRoutes } from "../modules/travelPlan/travelPlan.route";
import { TravelMatchRoutes } from "../modules/travelMatch/travleMatch.route";
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
