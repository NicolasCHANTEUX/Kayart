"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const showDelayMs = 90;
const minVisibleMs = 260;
const fallbackHideMs = 10000;

export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [isVisible, setIsVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const visibleSinceRef = useRef(0);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;

      if (!link || !shouldShowForLink(link)) {
        return;
      }

      startLoading();
    }

    function handlePopState() {
      startLoading();
    }

    function handlePageShow() {
      stopLoading();
    }

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    stopLoading();
  }, [routeKey]);

  function startLoading() {
    clearTimer(hideTimerRef);
    clearTimer(showTimerRef);
    clearTimer(fallbackTimerRef);

    showTimerRef.current = window.setTimeout(() => {
      visibleSinceRef.current = Date.now();
      setIsVisible(true);
    }, showDelayMs);

    fallbackTimerRef.current = window.setTimeout(() => {
      stopLoading();
    }, fallbackHideMs);
  }

  function stopLoading() {
    clearTimer(showTimerRef);
    clearTimer(fallbackTimerRef);

    const elapsed = visibleSinceRef.current ? Date.now() - visibleSinceRef.current : minVisibleMs;
    const delay = Math.max(minVisibleMs - elapsed, 0);

    clearTimer(hideTimerRef);
    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      visibleSinceRef.current = 0;
    }, delay);
  }

  function clearTimers() {
    clearTimer(showTimerRef);
    clearTimer(hideTimerRef);
    clearTimer(fallbackTimerRef);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div aria-live="polite" className="route-loading-overlay" role="status">
      <span aria-hidden="true" className="route-loading-indicator" />
      <span className="sr-only">Chargement de la page</span>
    </div>
  );
}

function shouldShowForLink(link: HTMLAnchorElement) {
  if (link.target && link.target !== "_self") {
    return false;
  }

  if (link.hasAttribute("download")) {
    return false;
  }

  const href = link.getAttribute("href");

  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  const nextUrl = new URL(link.href, window.location.href);
  const currentUrl = new URL(window.location.href);

  if (nextUrl.origin !== currentUrl.origin) {
    return false;
  }

  return (
    nextUrl.pathname !== currentUrl.pathname ||
    nextUrl.search !== currentUrl.search
  );
}

function clearTimer(timerRef: { current: number | null }) {
  if (timerRef.current) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}
