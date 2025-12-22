import { PlanVisibility, TravelType } from "../../generated/prisma/enums";

export interface ITravelPlan {
  destination: string;
  startDate: Date;
  endDate: Date;
  imageUrl?: string;
  minBudget?: number;
  maxBudget?: number;
  travelType: TravelType;
  description?: string;
  isPublic?: PlanVisibility;
  latitude?: number;
  longitude?: number;
  userId?: string;
}
