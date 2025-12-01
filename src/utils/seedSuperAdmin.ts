import bcryptjs from "bcryptjs";
import dbConfig from "../config/db.config";
import { prisma } from "../config/prisma";
import { IUser } from "../modules/user/user.interface";
import { UserRole } from "../generated/prisma/enums";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await prisma.user.findUnique({
      where: {
        email: dbConfig.superAdmin.email,
      },
    });

    if (isSuperAdminExist) {
      console.log("Super Admin Already Exists!");
      return;
    }

    console.log("Trying to create Super Admin...");

    const hashedPassword = await bcryptjs.hash(
      dbConfig.superAdmin.password!,
      Number(dbConfig.bcryptJs_salt)
    );

    const payload: IUser = {
      fullName: "Super admin",
      role: UserRole.SUPER_ADMIN,
      email: dbConfig.superAdmin.email!,
      password: hashedPassword,
      verifiedBadge: true,
      interests: ["Management", "All"],
      visitedCountries: ["Bangladesh"],
      isPublic: false,
    };

    const superadmin = await prisma.user.create({ data: payload });
    console.log("Super Admin Created Successfuly! \n");
    console.log(superadmin);
  } catch (error) {
    console.log(error);
  }
};
