import { SubnavTabs } from "@/components/ui/SubnavTabs";

const TABS = [
  { href: "/dashboard/inventory/medicines", label: "Medicines" },
  { href: "/dashboard/inventory/medical-items", label: "Medical Items" },
  { href: "/dashboard/inventory/batches", label: "Batches" },
  { href: "/dashboard/inventory/mobile-substores", label: "Mobile Substores" },
  { href: "/dashboard/inventory/stock-movements", label: "Stock Movements" },
] as const;

export function InventorySubnav() {
  return <SubnavTabs tabs={TABS} ariaLabel="Inventory sections" />;
}
