/**
 * App-wide toast helpers. Re-exports Sonner with a single import path.
 * Success: mutations (create/update/delete/save). Errors: API/network failures.
 * Omit toasts for client-side validation only.
 */
import { toast as sonnerToast } from "sonner";

// Webpack/SWC is more reliable with direct re-export than `export { toast } from ...`.
export const toast = sonnerToast;
