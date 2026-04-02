export const REPORTS_PERMS = {
  module: ["patients:read", "bookings:read", "invoices:read", "dispatch:read", "opd:read"],
  overview: ["patients:read", "bookings:read", "invoices:read"],
  financial: ["invoices:read"],
  operations: ["bookings:read", "dispatch:read", "opd:read"],
  clinical: ["bookings:read", "patients:read"],
  activity: ["bookings:read", "dispatch:read", "opd:read", "invoices:read"],
} as const;
