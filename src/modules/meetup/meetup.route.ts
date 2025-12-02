import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { MeetupController } from "./meetup.controller";

const router = Router();

router.post("/", checkAuth(), MeetupController.create);
router.get("/", MeetupController.getAll);
router.get("/:id", MeetupController.getSingle);
router.put("/:id", checkAuth(), MeetupController.update);
router.delete("/:id", checkAuth(), MeetupController.remove);

router.post("/:id/join", checkAuth(), MeetupController.joinMeetup);
router.post("/:id/leave", checkAuth(), MeetupController.leaveMeetup);
router.get("/:id/members", checkAuth(), MeetupController.members);

export const MeetupRoutes = router;
