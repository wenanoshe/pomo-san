import { useEffect, useRef } from "react";

/**
 * Best-effort screen wake lock. When `enabled` is true and the page is
 * visible, requests (and holds) a screen wake lock. Re-arms on
 * visibilitychange → visible. No-ops on browsers without `navigator.wakeLock`.
 *
 * @param {boolean} enabled
 */
export function useWakeLock(enabled) {
  const sentinelRef = useRef(null);

  const release = async () => {
    const s = sentinelRef.current;
    sentinelRef.current = null;
    if (s) {
      try {
        await s.release();
      } catch {
        /* already released */
      }
    }
  };

  const request = async () => {
    if (!enabled || document.visibilityState !== "visible") return;
    if (!("wakeLock" in navigator)) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request("screen");
    } catch (err) {
      console.warn("wakeLock request failed", err?.name ?? err);
    }
  };

  useEffect(() => {
    request();
    const onVis = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      release();
    };
  }, [enabled]);
}
