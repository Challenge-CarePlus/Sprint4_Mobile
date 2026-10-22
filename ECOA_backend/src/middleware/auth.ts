import { Request, RequestHandler, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config/jwt";
import { Role } from "../models/login";

export type AuthPayload = { id: string; email: string; role: Role };

function readToken(req: Request): string | null {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

function verify(token: string): AuthPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as Partial<AuthPayload>;
    if (typeof payload.id !== "string") return null; // token antigo (ids numéricos) não vale mais
    return {
      id: payload.id,
      email: String(payload.email),
      role: payload.role === "admin" ? "admin" : "patient",
    };
  } catch {
    return null;
  }
}

/** Exige token válido (qualquer papel). */
export function auth(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: "Token não informado" });
  }

  const user = verify(token);
  if (!user) {
    return res.status(401).json({ success: false, message: "Token inválido" });
  }

  res.locals.user = user;
  next();
}

/** Sem token segue anônimo; token presente porém inválido/expirado → 401 (o app descarta a sessão). */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next();

  const user = verify(token);
  if (!user) {
    return res.status(401).json({ success: false, message: "Token inválido" });
  }

  res.locals.user = user;
  next();
}

/** 401 sem token válido, 403 se o papel não bate. Sempre checado no servidor. */
export function requireRole(role: Role): RequestHandler[] {
  return [
    auth,
    (_req: Request, res: Response, next: NextFunction) => {
      if ((res.locals.user as AuthPayload).role !== role) {
        return res.status(403).json({ success: false, message: "Acesso negado" });
      }
      next();
    },
  ];
}

export const currentUser = (res: Response): AuthPayload | undefined => res.locals.user;
