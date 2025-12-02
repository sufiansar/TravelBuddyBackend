import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { MeetupService } from "./meetup.service";
import pick from "../../utils/pick";
import { UserPaginationableFields } from "../user/user.constant";

const create = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const data = req.body;
  const meetup = await MeetupService.createMeetup(data, user);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Meetup created successfully",
    data: meetup,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm"]);
  const options = pick(req.query, UserPaginationableFields);

  const result = await MeetupService.getAllMeetups(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetups fetched successfully",
    data: result,
  });
});

const getSingle = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const meetup = await MeetupService.getSingleMeetup(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetup fetched successfully",
    data: meetup,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const data = req.body;
  const updated = await MeetupService.updateMeetup(id, data, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetup updated successfully",
    data: updated,
  });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const result = await MeetupService.deleteMeetup(id, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meetup deleted",
    data: result,
  });
});

const joinMeetup = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const member = await MeetupService.joinMeetup(id, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Joined meetup",
    data: member,
  });
});

const leaveMeetup = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const result = await MeetupService.leaveMeetup(id, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Left meetup",
    data: result,
  });
});

const members = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const list = await MeetupService.getMeetupMembers(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Members fetched",
    data: list,
  });
});

export const MeetupController = {
  create,
  getAll,
  getSingle,
  update,
  remove,
  joinMeetup,
  leaveMeetup,
  members,
};
