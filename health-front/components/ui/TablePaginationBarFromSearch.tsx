"use client";

import { pageQueryString } from "@/lib/pagination";

import { TablePaginationBar } from "./TablePaginationBar";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  /** Route path without query string, e.g. `/dashboard/payments/opd-invoices` */
  pathname: string;
  /** Current search query (may be empty) */
  q: string;
};

/**
 * Server-friendly pagination for list pages that use `page` + `q` URL params.
 * Builds `hrefForPage` on the client so RSC pages do not pass functions into Client Components.
 */
export function TablePaginationBarFromSearch({ page, pageSize, total, pathname, q }: Props) {
  return (
    <TablePaginationBar
      page={page}
      pageSize={pageSize}
      total={total}
      hrefForPage={(p) => `${pathname}?${pageQueryString(p, pageSize, q)}`}
    />
  );
}
