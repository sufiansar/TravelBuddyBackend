import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { PostService } from "./post.service";
import pick from "../../utils/pick";
import { PostPaginationableFields } from "./post.constant";

const create = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const files = (req as any).files as any[];
  const content = (req.body.content as string) || null;
  const post = await PostService.createPost({ content }, files, user);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Post created",
    data: post,
  });
});

const getPosts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["userId", "searchTerm"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await PostService.getPosts(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Posts fetched",
    data: result,
  });
});

const getMyPosts = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const options = pick(req.query, PostPaginationableFields);

  const result = await PostService.getMyPosts(user, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My posts fetched",
    data: result,
  });
});

const single = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await PostService.getSinglePost(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post fetched",
    data: post,
  });
});

const react = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type } = req.body;
  const user = (req as any).user;
  const result = await PostService.reactToPost(id, user, type);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reacted",
    data: result,
  });
});

const unreact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const result = await PostService.removeReaction(id, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reaction removed",
    data: result,
  });
});

const save = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const result = await PostService.savePost(id, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Saved",
    data: result,
  });
});

const unsave = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const result = await PostService.unsavePost(id, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unsaved",
    data: result,
  });
});

const share = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  const user = (req as any).user;
  const result = await PostService.sharePost(id, user, message);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shared",
    data: result,
  });
});

const saved = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const list = await PostService.getSavedPostsForUser(user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Saved posts",
    data: list,
  });
});

const createComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const { content } = req.body;
  const comment = await (PostService as any).createComment(id, user, content);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Comment created",
    data: comment,
  });
});

const getComments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // post id
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await (PostService as any).getComments(id, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments fetched",
    data: result,
  });
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const user = (req as any).user;
  const { content } = req.body;
  const updated = await (PostService as any).updateComment(
    commentId,
    user,
    content
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment updated",
    data: updated,
  });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const user = (req as any).user;
  const result = await (PostService as any).deleteComment(commentId, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment deleted",
    data: result,
  });
});

export const PostController = {
  create,
  getPosts,
  single,
  getMyPosts,
  react,
  unreact,
  save,
  unsave,
  share,
  saved,
  createComment,
  getComments,
  updateComment,
  deleteComment,
};
