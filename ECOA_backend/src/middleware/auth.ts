import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = "ecoafono_secret";

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
    jwt.verify(token, SECRET);

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }
}