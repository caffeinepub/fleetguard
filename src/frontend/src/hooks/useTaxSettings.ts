import { useState } from "react";

export interface TaxSettings {
  taxLabel: string;
  taxRate: number;
  enabled: boolean;
}

const DEFAULT: TaxSettings = { taxLabel: "Tax", taxRate: 0, enabled: false };

export function useTaxSettings() {
  const [settings, setSettings] = useState<TaxSettings>(() => {
    try {
      const stored = localStorage.getItem("fleetguard_tax_settings");
      if (stored) return JSON.parse(stored) as TaxSettings;
    } catch {}
    return DEFAULT;
  });

  const saveTaxSettings = (s: TaxSettings) => {
    localStorage.setItem("fleetguard_tax_settings", JSON.stringify(s));
    setSettings(s);
  };

  return { taxSettings: settings, saveTaxSettings };
}
