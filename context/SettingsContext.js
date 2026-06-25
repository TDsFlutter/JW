"use client";

import { createContext, useContext, useState, useEffect } from "react";

const DEFAULT_DISCOUNT_TIERS = [
  { label: "5% OFF", sub: "On prepaid orders", enabled: true },
  { label: "10% OFF", sub: "On orders above ₹1,499", enabled: true },
  { label: "15% OFF", sub: "On orders above ₹2,999", enabled: true },
];

const DEFAULTS = {
  googleReviewsEnabled: true,
  productReviewsEnabled: true,
  discountTiers: DEFAULT_DISCOUNT_TIERS,
  loaded: false,
};

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
          discountTiers:
            d && Array.isArray(d.discountTiers) && d.discountTiers.length
              ? d.discountTiers
              : DEFAULT_DISCOUNT_TIERS,
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
