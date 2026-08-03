"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

function isModifiedEvent(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldStartProgress(anchor, event) {
  if (!anchor) return false;
  if (anchor.dataset?.nprogress === "false") return false;
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  if (isModifiedEvent(event)) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return false;

  if (href.startsWith("http")) {
    try {
      const targetUrl = new URL(href);
      if (targetUrl.origin !== window.location.origin) return false;
    } catch (_) {
      return false;
    }
  }

  return true;
}

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";

  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.12 });
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      const anchor = event.target.closest("a");
      if (!shouldStartProgress(anchor, event)) return;
      NProgress.start();
    };

    const handlePopState = () => {
      NProgress.start();
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchKey]);

  return null;
}
