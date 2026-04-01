"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { UpcomingBookingRow } from "@/components/dispatch/types";

type Props = {
  b: UpcomingBookingRow;
  active: boolean;
  canSaveVisitDraft: boolean;
  reportBusy: boolean;
  onUploadReports: (files: FileList | null) => void;
};

function isImageReportName(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
}

export function ReportsTab({ b, active, canSaveVisitDraft, reportBusy, onUploadReports }: Props) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reports = b.visitRecord?.diagnosticReports ?? [];
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div
      role="tabpanel"
      id={`patient-booking-${b.id}-panel-reports`}
      hidden={!active}
      className="space-y-4 px-3 py-3"
    >
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Upload documents
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Attach lab reports, scans, or PDFs for this visit. Files are stored securely and linked to the
          patient record.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            className="sr-only"
            multiple
            accept="application/pdf,image/*,.pdf,.doc,.docx"
            disabled={reportBusy || !canSaveVisitDraft}
            onChange={(e) => {
              onUploadReports(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="h-9 px-3 text-xs"
            disabled={reportBusy || !canSaveVisitDraft}
            isLoading={reportBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {reportBusy ? "Uploading…" : "Choose files"}
          </Button>
          {!canSaveVisitDraft ? (
            <span className="text-xs text-[var(--text-muted)]">Saving reports requires visit access.</span>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Uploaded ({reports.length})
        </p>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">No documents yet.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {reports.map((r) => {
              const showThumb = isImageReportName(r.reportName);
              return (
                <li
                  key={r.id}
                  className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                >
                  <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {r.reportName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(r.uploadedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}{" "}
                        · {r.uploadedBy.fullName}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {showThumb ? (
                        <button
                          type="button"
                          className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
                          onClick={() => setPreviewUrl(r.fileUrl)}
                        >
                          Preview
                        </button>
                      ) : null}
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                  {showThumb ? (
                    <button
                      type="button"
                      className="block w-full border-t border-[var(--border)] bg-black/5 p-2 text-left dark:bg-white/5"
                      onClick={() => setPreviewUrl(r.fileUrl)}
                      aria-label={`Preview ${r.reportName}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.fileUrl}
                        alt=""
                        className="mx-auto max-h-40 w-auto max-w-full rounded object-contain"
                      />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
            onClick={() => setPreviewUrl(null)}
          >
            Close
          </button>
          <div className="max-h-[90vh] max-w-[min(100%,56rem)] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Report preview" className="max-h-[85vh] w-full object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
