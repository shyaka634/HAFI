"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth/client";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const SESSION_HEARTBEAT_MS = 30 * 1000;

export function SessionIdleGuard() {
  useEffect(() => {
    let disposed = false;
    let signedIn = false;
    let signingOut = false;
    let lastActivityAt = Date.now();

    async function endInactiveSession() {
      if (signingOut || disposed) return;
      signingOut = true;

      try {
        await authClient.signOut();
      } catch {
        // The redirect still protects the UI if the device is offline.
      }

      if (!disposed) window.location.assign("/sign-in?reason=inactive");
    }

    async function checkSession() {
      if (!signedIn || signingOut || disposed) return;

      // Do not extend a session while the person is on another tab, has
      // minimized the browser, or has left the app.
      if (document.visibilityState !== "visible") return;

      if (Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS) {
        await endInactiveSession();
        return;
      }

      try {
        const { data } = await authClient.getSession();
        if (!data?.user) await endInactiveSession();
      } catch {
        await endInactiveSession();
      }
    }

    function recordActivity() {
      lastActivityAt = Date.now();
    }

    const activityEvents: Array<keyof WindowEventMap> = ["keydown", "pointerdown", "scroll", "touchstart"];
    for (const eventName of activityEvents) window.addEventListener(eventName, recordActivity, { passive: true });

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Leaving the app begins the five-minute inactivity period.
        lastActivityAt = Date.now();
        return;
      }
      void checkSession();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    authClient.getSession()
      .then(({ data }) => {
        if (!disposed) signedIn = Boolean(data?.user);
      })
      .catch(() => {
        signedIn = false;
      });

    const heartbeat = window.setInterval(() => void checkSession(), SESSION_HEARTBEAT_MS);

    return () => {
      disposed = true;
      window.clearInterval(heartbeat);
      for (const eventName of activityEvents) window.removeEventListener(eventName, recordActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
