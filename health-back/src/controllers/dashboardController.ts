import type { Request, Response } from "express";

import { loadPermissionKeys } from "../middleware/permissions";
import { buildDashboardSummary } from "../services/dashboardSummaryService";

export async function getDashboardSummaryHandler(req: Request, res: Response) {
  const userId = req.authUser?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const permissionKeys = await loadPermissionKeys(req);
  const summary = await buildDashboardSummary({ userId, permissionKeys });
  return res.json(summary);
}
