import express from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRouters } from "../modules/auth/auth.route";
import { TravelPlanRoutes } from "../modules/travelPlan/travelPlan.route";
import { TravelMatchRoutes } from "../modules/travelMatch/travleMatch.route";
import { MeetupRoutes } from "../modules/meetup/meetup.route";
import { PostRoutes } from "../modules/post/post.route";
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
    path: "/posts",
    route: PostRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
