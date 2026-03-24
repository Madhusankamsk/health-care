/**
 * App-wide toast helpers. Re-exports Sonner with a single import path.
 * Success: mutations (create/update/delete/save). Errors: API/network failures.
 * Omit toasts for client-side validation only.
 */
export { toast } from "sonner";
