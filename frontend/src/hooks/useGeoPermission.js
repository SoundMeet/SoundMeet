import { useState, useCallback, useEffect } from "react";

/**
 * useGeoPermission
 *
 * Manages browser geolocation permission state for the guest discovery gate.
 *
 * Returned status values:
 *   'checking'   — request in flight (initial or after retry)
 *   'granted'    — position obtained, access allowed
 *   'promptable' — denied this session but browser will re-prompt
 *   'denied'     — permanently blocked in browser settings
 *   'unavailable'— browser has no geolocation API
 */
export function useGeoPermission() {
  const [status, setStatus] = useState("checking");

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      return;
    }

    setStatus("checking");

    navigator.geolocation.getCurrentPosition(
      () => {
        setStatus("granted");
      },
      async (err) => {
        // code 1 = PERMISSION_DENIED; codes 2/3 = position/timeout errors
        if (err.code === 1) {
          try {
            const perm = await navigator.permissions.query({ name: "geolocation" });
            // perm.state: 'granted' | 'denied' | 'prompt'
            setStatus(perm.state === "denied" ? "denied" : "promptable");
          } catch {
            // Permissions API unavailable — assume re-promptable
            setStatus("promptable");
          }
        } else {
          // Position unavailable or timeout — not a permission issue, let through
          setStatus("granted");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    request();
  }, []);

  return { status, retry: request };
}
