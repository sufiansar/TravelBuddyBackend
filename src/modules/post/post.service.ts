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

  const postsWithCounts = await prisma.post.findMany({
    where,
    include: {
      user: true,
      reactions: { include: { user: true } },
      saves: { include: { user: true } },
      shares: { include: { user: true } },
      postComments: { include: { user: true } },
    },
    orderBy: { [sortBy]: sortOrder },
    take: limit,
    skip,
  });

  const data = postsWithCounts.map((post) => ({
    ...post,
    _count: {
      comments: post.postComments?.length || 0,
      reactions: post.reactions?.length || 0,
      saves: post.saves?.length || 0,
      shares: post.shares?.length || 0,
    },
  }));

  const total = await prisma.post.count({ where });
  const totalPage = Math.ceil(total / Number(limit));

  return { meta: { page, limit, total, totalPage }, data };
};
const getSinglePost = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: true,
      reactions: { include: { user: true } },
      saves: { include: { user: true } },
      shares: { include: { user: true } },
      postComments: true,
    },
  });

  if (!post) return null;

  return {
    ...post,
    _count: {
      comments: post.postComments?.length || 0,
      reactions: post.reactions?.length || 0,
      saves: post.saves?.length || 0,
      shares: post.shares?.length || 0,
    },
  };
};
const getMyPosts = async (user: any, options: Ioptions = {}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where: Prisma.PostWhereInput = { userId: user.id };

  const postsWithCounts = await prisma.post.findMany({
    where,
    include: {
      user: true,
      reactions: { include: { user: true } },
      saves: { include: { user: true } },
      shares: { include: { user: true } },
      postComments: true,
    },
    orderBy: { [sortBy]: sortOrder },
    take: limit,
    skip,
  });

  const data = postsWithCounts.map((post) => ({
    ...post,
    _count: {
      comments: post.postComments?.length || 0,
      reactions: post.reactions?.length || 0,
      saves: post.saves?.length || 0,
      shares: post.shares?.length || 0,
    },
  }));

  const total = await prisma.post.count({ where });
  const totalPage = Math.ceil(total / Number(limit));

  return { meta: { page, limit, total, totalPage }, data };
};

const updatePost = async (
  postId: string,
  user: any,
  content: string | null,
  files: any[]
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.userId !== user.id)
    throw new Error("Not authorized to update this post");

  const images: string[] = (files || []).map(
    (f: any) => f.path || f.secure_url || f.url || f.location || ""
  );

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      content: content !== null ? content : post.content,
      images: images.length > 0 ? images : post.images,
    },
    include: { user: true },
  });
  return updated;
};
const deletePost = async (postId: string, user: any) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.userId !== user.id)
    throw new Error("Not authorized to delete this post");

  // Delete post — all related reactions, saves, shares, comments are deleted automatically
  await prisma.post.delete({ where: { id: postId } });

  return { success: true };
};

const reactToPost = async (postId: string, user: any, type: ReactionType) => {
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
  const totalPage = Math.ceil(total / Number(limit));

  return { meta: { page, limit, total, totalPage }, data };
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
  updatePost,
  deletePost,
};
