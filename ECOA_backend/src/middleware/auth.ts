import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config/jwt";

export type AuthPayload = { id: number; email: string; access: string };

export function auth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Token não informado",
    });
  }

  const [, token] = authHeader.split(" ");

  try {
    res.locals.user = jwt.verify(token, JWT_SECRET) as AuthPayload;

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }
}
