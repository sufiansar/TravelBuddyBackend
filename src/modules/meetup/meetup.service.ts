import { prisma } from "../../config/prisma";
import { UserRole } from "../../generated/prisma/enums";
import { paginationHelper, Ioptions } from "../../utils/paginationHelper";
import { Prisma } from "../../generated/prisma/client";

export const createMeetup = async (data: any, user: any) => {
  const meetup = await prisma.meetup.create({
    data: {
      title: data.title,
      location: data.location,
      date: new Date(data.date),
      description: data.description,
      maxPeople: data.maxPeople ? Number(data.maxPeople) : null,
      hostId: user.id,
    },
    include: { host: true },
  });

  return meetup;
};

export const getAllMeetups = async (
  filters: any = {},
  options: Ioptions = {}
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = filters;
  const andConditions: Prisma.MeetupWhereInput[] = [];
  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { location: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const where: Prisma.MeetupWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const data = await prisma.meetup.findMany({
    where,
    include: { host: true, participants: { include: { user: true } } },
    orderBy: { [sortBy]: sortOrder },
    take: limit,
    skip,
  });

  const total = await prisma.meetup.count({ where });

  return { meta: { page, limit, total }, data };
};

export const getSingleMeetup = async (id: string) => {
  const meetup = await prisma.meetup.findUnique({
    where: { id },
    include: { host: true, participants: { include: { user: true } } },
  });
  return meetup;
};

export const updateMeetup = async (id: string, data: any, user: any) => {
  const meetup = await prisma.meetup.findUnique({ where: { id } });
  if (!meetup) throw new Error("Meetup not found");
  if (meetup.hostId !== user.id && user.role !== UserRole.ADMIN) {
    throw new Error("Not authorized to update this meetup");
  }

  const updated = await prisma.meetup.update({
    where: { id },
    data: {
      title: data.title ?? undefined,
      location: data.location ?? undefined,
      date: data.date ? new Date(data.date) : undefined,
      description: data.description ?? undefined,
      maxPeople: data.maxPeople ?? undefined,
    },
    include: { host: true },
  });
  return updated;
};

export const deleteMeetup = async (id: string, user: any) => {
  const meetup = await prisma.meetup.findUnique({ where: { id } });
  if (!meetup) throw new Error("Meetup not found");
  if (meetup.hostId !== user.id && user.role !== UserRole.ADMIN) {
    throw new Error("Not authorized to delete this meetup");
  }

  // remove members first to avoid constraint issues
  await prisma.meetupMember.deleteMany({ where: { meetupId: id } });
  await prisma.meetup.delete({ where: { id } });
  return { success: true };
};

export const joinMeetup = async (meetupId: string, user: any) => {
  const meetup = await prisma.meetup.findUnique({
    where: { id: meetupId },
    include: { participants: true },
  });
  if (!meetup) throw new Error("Meetup not found");

  if (meetup.maxPeople && meetup.participants.length >= meetup.maxPeople) {
    throw new Error("Meetup is full");
  }

  if (user.id === meetup.hostId) {
    throw new Error("Host cannot join as participant");
  }

  const exists = await prisma.meetupMember.findUnique({
    where: { meetupId_userId: { meetupId, userId: user.id } },
  });
  if (exists) return exists;

  const member = await prisma.meetupMember.create({
    data: { meetupId, userId: user.id },
    include: { user: true },
  });
  return member;
};

export const leaveMeetup = async (meetupId: string, user: any) => {
  const member = await prisma.meetupMember.findUnique({
    where: { meetupId_userId: { meetupId, userId: user.id } },
  });
  if (!member) throw new Error("Not a member of this meetup");
  await prisma.meetupMember.delete({ where: { id: member.id } });
  return { success: true };
};

export const getMeetupMembers = async (meetupId: string) => {
  const members = await prisma.meetupMember.findMany({
    where: { meetupId },

    include: { user: true },
  });
  return members;
};

export const MeetupService = {
  createMeetup,
  getAllMeetups,
  getSingleMeetup,
  updateMeetup,
  deleteMeetup,
  joinMeetup,
  leaveMeetup,
  getMeetupMembers,
};
