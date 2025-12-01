import { NextFunction, Request, Response } from "express";

import dbConfig from "../config/db.config";

import { UserPayload, verifyToken } from "../utils/jwt";

const checkAuth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Token missing." });
      }

      const user: UserPayload = verifyToken(
        token,
        dbConfig.jwt.accessToken_secret!
      );

      if (!user?.id || !user?.email) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid token payload." });
      }

      req.user = user; // attach user to request

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this route.",
        });
      }

      next();
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token." });
    }
  };
};

export default checkAuth;
