import { Router } from "express";
import checkAuth from "../../middleware/checkAuth";
import { multerUpload } from "../../config/multer.congig";
import { PostController } from "./post.controller";

const router = Router();
router.post(
  "/",
  checkAuth(),
  multerUpload.array("images", 10),
  PostController.create
);
router.get("/", PostController.getPosts);
router.get("/:id", PostController.single);
router.post("/:id/react", checkAuth(), PostController.react);
router.delete("/:id/react", checkAuth(), PostController.unreact);
router.post("/:id/save", checkAuth(), PostController.save);
router.delete("/:id/save", checkAuth(), PostController.unsave);
router.post("/:id/share", checkAuth(), PostController.share);
router.get("/saved/me", checkAuth(), PostController.saved);
router.post("/:id/comment", checkAuth(), PostController.createComment);
router.get("/:id/comments", PostController.getComments);
router.patch("/comments/:commentId", checkAuth(), PostController.updateComment);
router.delete(
  "/comments/:commentId",
  checkAuth(),
  PostController.deleteComment
);

export const PostRoutes = router;
