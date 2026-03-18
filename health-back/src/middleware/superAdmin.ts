import { Request, Response, NextFunction } from "express";

function normalizeRole(role: unknown): string {
  return typeof role === "string" ? role.trim().toLowerCase() : "";
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const role = normalizeRole(req.authUser?.role);
  if (role === "superadmin" || role === "super_admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
}

