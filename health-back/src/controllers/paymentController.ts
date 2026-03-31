import type { Request, Response } from "express";

import {
  listCollectorDailySummary,
  listPayments,
  settleCollectorDaily,
} from "../services/paymentService";

export async function listPaymentsHandler(_req: Request, res: Response) {
  const rows = await listPayments();
  return res.json(rows);
}

export async function listCollectorDailySummaryHandler(req: Request, res: Response) {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    const result = await listCollectorDailySummary(date);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load collector summary";
    if (message === "Invalid date") {
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message: "Unable to load collector summary" });
  }
}

export async function settleCollectorDailyHandler(req: Request, res: Response) {
  const { date, collectorId, paymentMethodKey } = req.body as Partial<{
    date: string;
    collectorId: string;
    paymentMethodKey: string;
  }>;

  try {
    const result = await settleCollectorDaily({
      date,
      collectorId: collectorId?.trim() ?? "",
      paymentMethodKey: paymentMethodKey?.trim() ?? "",
      settledByUserId: req.authUser?.sub,
    });
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to settle collector total";
    if (
      message === "Invalid date" ||
      message.includes("collectorId is required") ||
      message.includes("paymentMethodKey must be CASH or CHEQUE")
    ) {
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message: "Unable to settle collector total" });
  }
}
