import type { Request, Response } from "express";

import {
  listOutstandingOpdInvoices as fetchOutstandingOpdInvoicesPage,
  recordOpdInvoicePayment,
} from "../services/opdInvoicePaymentService";
import { okPaginated, parseOptionalQueryString, parsePaginationQuery } from "../lib/pagination";

export async function listOutstandingOpdInvoicesHandler(req: Request, res: Response) {
  const { page, pageSize, skip, take } = parsePaginationQuery(req);
  const q = parseOptionalQueryString(req);
  const { items, total } = await fetchOutstandingOpdInvoicesPage({ skip, take, q });
  return okPaginated(res, { items, total, page, pageSize });
}

export async function recordOpdInvoicePaymentHandler(req: Request, res: Response) {
  const { id: invoiceId } = req.params;
  const { amountPaid, paymentMethodId, transactionRef, paySlipUrl } = req.body as Partial<{
    amountPaid: number | string;
    paymentMethodId: string;
    transactionRef: string | null;
    paySlipUrl: string | null;
  }>;

  const collectedByUserId = req.authUser?.sub;

  try {
    const result = await recordOpdInvoicePayment({
      invoiceId,
      amountPaid: amountPaid ?? "",
      paymentMethodId: paymentMethodId?.trim() ?? "",
      transactionRef: transactionRef ?? undefined,
      paySlipUrl: paySlipUrl ?? undefined,
      collectedByUserId: collectedByUserId ?? "",
    });
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record payment";
    if (
      message === "Invoice is not an OPD invoice" ||
      message === "Invoice has no balance due" ||
      message === "Amount must be positive" ||
      message === "Amount exceeds balance due" ||
      message === "Invalid paymentMethodId" ||
      message.includes("collectedByUserId")
    ) {
      return res.status(400).json({ message });
    }
    if (message.startsWith("Missing lookup")) {
      return res.status(400).json({ message });
    }
    return res.status(500).json({ message: "Unable to record payment" });
  }
}
