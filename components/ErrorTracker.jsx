"use client";
import { useEffect } from "react";
import { trackException } from "@/lib/firebase";

// Reports uncaught JS errors and unhandled promise rejections to Firebase
// Analytics as "exception" events — the web equivalent of Crashlytics
// (which is mobile-only). No-ops until Analytics has a measurementId.
export default function ErrorTracker() {
  useEffect(() => {
    const onError = (event) => {
      trackException(event?.error || event?.message || "Unknown error", true);
    };
    const onRejection = (event) => {
      trackException(event?.reason || "Unhandled promise rejection", true);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
