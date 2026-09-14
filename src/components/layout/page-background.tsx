"use client";

import { useEffect } from "react";

// The layout survives navigation, unlike the page inside the loading boundary.
export function PageBackground() {
  useEffect(() => {
    const main = document.getElementById("main-content");
    const shell = main?.closest<HTMLElement>(".shell");
    if (!main || !shell) return;

    function syncBackground() {
      // Suspense can keep the previous page hidden while showing its fallback.
      // Retain the last completed page's background until real content is visible.
      if (Array.from(main!.querySelectorAll(".route-loading-screen")).some(element => element.getClientRects().length > 0)) return;
      const ambient = Array.from(main!.querySelectorAll(".home-page,.shop-page"))
        .some(element => element.getClientRects().length > 0);
      shell!.dataset.pageBackground = ambient ? "ambient" : "plain";
    }

    syncBackground();
    const observer = new MutationObserver(syncBackground);
    // Observe page replacement and Suspense's hidden/visible state, not form values.
    observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "hidden"] });
    return () => {
      observer.disconnect();
      delete shell.dataset.pageBackground;
    };
  }, []);

  return null;
}
