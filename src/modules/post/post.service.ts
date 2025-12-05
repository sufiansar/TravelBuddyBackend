import { prisma } from "../../config/prisma";
import { ReactionType } from "../../generated/prisma/enums";
import { paginationHelper, Ioptions } from "../../utils/paginationHelper";
import { Prisma } from "../../generated/prisma/client";

const createPost = async (data: any, files: any[], user: any) => {
  const images: string[] = (files || []).map(
    (f: any) => f.path || f.secure_url || f.url || f.location || ""
  );

  const post = await prisma.post.create({
    data: {
      content: data.content,
      images,
      userId: user.id,
    },
    include: { user: true },
  });
  return post;
};
const getPosts = async (filters: any = {}, options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = filters;
  const andConditions: Prisma.PostWhereInput[] = [];
  if (searchTerm) {
    andConditions.push({
      OR: [
        { content: { contains: searchTerm, mode: "insensitive" } },
        { user: { fullName: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: filterData[key] },
      })),
    });
  }

  const where: Prisma.PostWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const data = await prisma.post.findMany({
    where,
    include: {
      user: true,
      reactions: { include: { user: true } },
      saves: { include: { user: true } },
      shares: { include: { user: true } },
    },
    orderBy: { [sortBy]: sortOrder },
    take: limit,
    skip,
  });

  const total = await prisma.post.count({ where });

  return { meta: { page, limit, total }, data };
};
const getSinglePost = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: true,
      reactions: { include: { user: true } },
      saves: { include: { user: true } },
      shares: { include: { user: true } },
    },
  });
  return post;
};
const getMyPosts = async (user: any, options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where: Prisma.PostWhereInput = { userId: user.id };

  const data = await prisma.post.findMany({
    where,
    include: {
      user: true,
      reactions: { include: { user: true } },
      saves: { include: { user: true } },
      shares: { include: { user: true } },
    },
    orderBy: { [sortBy]: sortOrder },
    take: limit,
    skip,
  });

  const total = await prisma.post.count({ where });

  return { meta: { page, limit, total }, data };
};
const reactToPost = async (postId: string, user: any, type: ReactionType) => {
  // upsert reaction
  const existing = await prisma.postReaction
    .findUnique({ where: { postId_userId: { postId, userId: user.id } } })
    .catch(() => null);
  if (existing) {
    const updated = await prisma.postReaction.update({
      where: { id: existing.id },
      data: { type },
    });
    return updated;
  }
  const created = await prisma.postReaction.create({
    data: { postId, userId: user.id, type },
  });
  return created;
};

const removeReaction = async (postId: string, user: any) => {
  await prisma.postReaction.deleteMany({ where: { postId, userId: user.id } });
  return { success: true };
};

const savePost = async (postId: string, user: any) => {
  const exists = await prisma.postSave
    .findUnique({ where: { postId_userId: { postId, userId: user.id } } })
    .catch(() => null);
  if (exists) return exists;
  const created = await prisma.postSave.create({
    data: { postId, userId: user.id },
  });
  return created;
};

const unsavePost = async (postId: string, user: any) => {
  await prisma.postSave.deleteMany({ where: { postId, userId: user.id } });
  return { success: true };
};

export const sharePost = async (
  postId: string,
  user: any,
  message?: string
) => {
  const created = await prisma.postShare.create({
    data: { postId, userId: user.id, message },
  });
  return created;
};

const getSavedPostsForUser = async (userId: string) => {
  const saved = await prisma.postSave.findMany({
    where: { userId },
    include: { post: { include: { user: true } } },
  });
  return saved;
};

const createComment = async (postId: string, user: any, content: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");

  const comment = await prisma.postComment.create({
    data: { postId, userId: user.id, content },
    include: { user: true },
  });
  return comment;
};

const getComments = async (postId: string, options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where: Prisma.PostCommentWhereInput = { postId };

  const data = await prisma.postComment.findMany({
    where,
    include: { user: true },
    orderBy: { [sortBy]: sortOrder },
    take: limit,
    skip,
  });

  const total = await prisma.postComment.count({ where });

  return { meta: { page, limit, total }, data };
};

export const updateComment = async (
  commentId: string,
  user: any,
  content: string
) => {
  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== user.id)
    throw new Error("Not authorized to update this comment");

  const updated = await prisma.postComment.update({
    where: { id: commentId },
    data: { content },
    include: { user: true },
  });
  return updated;
};

const deleteComment = async (commentId: string, user: any) => {
  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: { post: true },
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== user.id && user.role !== "ADMIN")
    throw new Error("Not authorized to delete this comment");

  await prisma.postComment.delete({ where: { id: commentId } });
  return { success: true };
};

export const PostService = {
  createPost,
  getPosts,
  getSinglePost,
  getMyPosts,
  reactToPost,
  removeReaction,
  savePost,
  unsavePost,
  sharePost,
  getSavedPostsForUser,
  createComment,
  getComments,
  updateComment,
  deleteComment,
};
