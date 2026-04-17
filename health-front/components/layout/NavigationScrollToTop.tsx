"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

export function NavigationScrollToTop() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-app-scroll-root]");
    if (root) {
      root.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  return null;
}
