import { TErrorResponse, TErrorSources } from "../interface/error";

export const handlerZodError = (err: any): TErrorResponse => {
  const errorSources: TErrorSources[] = [];

  err.issues.forEach((issue: any) => {
    errorSources.push({
      path: issue.path[issue.path.length - 1],
      message: issue.message,
    });
  });

  return {
    statusCode: 400,
    message: "Zod Error",
    errorSources,
  };
};
