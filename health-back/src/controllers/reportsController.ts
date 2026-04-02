import type { Request, Response } from "express";

import {
  getReportsActivity,
  getReportsClinical,
  getReportsFinancial,
  getReportsOperations,
  getReportsOverview,
} from "../services/reportsService";

export async function getReportsOverviewHandler(_req: Request, res: Response) {
  const data = await getReportsOverview();
  return res.json(data);
}

export async function getReportsFinancialHandler(_req: Request, res: Response) {
  const data = await getReportsFinancial();
  return res.json(data);
}

export async function getReportsOperationsHandler(_req: Request, res: Response) {
  const data = await getReportsOperations();
  return res.json(data);
}

export async function getReportsClinicalHandler(_req: Request, res: Response) {
  const data = await getReportsClinical();
  return res.json(data);
}

export async function getReportsActivityHandler(_req: Request, res: Response) {
  const data = await getReportsActivity();
  return res.json(data);
}
