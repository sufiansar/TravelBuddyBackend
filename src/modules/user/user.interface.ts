import { Gender, UserRole } from "../../generated/prisma/enums";

export interface IUser {
  id?: string;
  fullName: string;
  username?: string | null;
  email: string;
  password: string;
  role: UserRole;
  bio?: string | null;
  profileImage?: string | null;
  gender?: Gender;
  currentLocation?: string | null;
  verifiedBadge: boolean;
  interests: string[];
  visitedCountries: string[];
  isPublic: boolean;
}
