import jwt, { SignOptions } from "jsonwebtoken";

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (
  user: UserPayload,
  secret: string,
  expiresIn: string
) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn } as SignOptions
  );
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as UserPayload;
};
