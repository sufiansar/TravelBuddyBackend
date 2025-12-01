import { z } from "zod";
import { Gender, UserRole } from "../../generated/prisma/enums";

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().min(1, "Full name is required"),
  username: z.string().optional().nullable(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  bio: z.string().optional().nullable(),
  profileImage: z.string().url("Invalid URL").optional().nullable(),
  gender: z.nativeEnum(Gender).optional(),
  currentLocation: z.string().optional().nullable(),
  verifiedBadge: z.boolean().default(false),
  interests: z.array(z.string()).optional(),
  visitedCountries: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
});
