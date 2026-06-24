"use client";

import { createContext, useContext, useState, useEffect } from "react";

const DEFAULTS = { googleReviewsEnabled: true, productReviewsEnabled: true, loaded: false };

const SettingsContext = createContext(DEFAULTS);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        setSettings({
          googleReviewsEnabled: d ? d.googleReviewsEnabled !== false : true,
          productReviewsEnabled: d ? d.productReviewsEnabled !== false : true,
          loaded: true,
        });
      })
      .catch(() => {
        if (active) setSettings((s) => ({ ...s, loaded: true }));
      });
    return () => {
      active = false;
    };
  }, []);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
