"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isCountedLocation, isCountedPath, sendVisit, visitPayload } from "../lib/visitBeacon";

/* document.referrer stays the same for the whole load; it goes with the first visit only. */
let referrerSent = false;

/** Counts a page view on load and on each route change (lib/visitBeacon.ts). Renders nothing. */
export default function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    const { hostname, protocol, search } = window.location;
    if (!isCountedLocation({ hostname, protocol }) || !isCountedPath(pathname || "/")) return;
    const timer = window.setTimeout(() => {
      const payload = visitPayload({
        pathname: pathname || "/",
        search,
        referrer: document.referrer,
        ownHost: hostname,
        includeReferrer: !referrerSent,
      });
      referrerSent = true;
      sendVisit(payload);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
