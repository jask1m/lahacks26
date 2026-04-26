export type AIModel = "gemma" | "claude";

export interface ComputeSettings {
  model: AIModel;
  cloudCompute: boolean;
}

const STORAGE_KEY = "compute-settings";

const DEFAULT_SETTINGS: ComputeSettings = {
  model: "gemma",
  cloudCompute: false,
};

export function getComputeSettings(): ComputeSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }

  return DEFAULT_SETTINGS;
}

export function setComputeSettings(settings: Partial<ComputeSettings>): void {
  if (typeof window === "undefined") {
    return;
  }

  const current = getComputeSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Sync to server via cookie
  fetch("/api/compute-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  }).catch(() => {
    // Ignore sync errors
  });

  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent("compute-settings-changed", { detail: updated }));
}

export function getEffectiveProvider(): "gemma-api" | "gemma-vultr" | "claude" {
  const settings = getComputeSettings();

  if (settings.cloudCompute) {
    return "gemma-vultr";
  }

  return settings.model === "claude" ? "claude" : "gemma-api";
}

export function getServerComputeSettings(cookieHeader: string | null): ComputeSettings {
  if (!cookieHeader) {
    return DEFAULT_SETTINGS;
  }

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const settingsCookie = cookies["compute-settings"];
  if (settingsCookie) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(decodeURIComponent(settingsCookie)) };
    } catch {
      // Invalid JSON
    }
  }

  return DEFAULT_SETTINGS;
}

export function getEffectiveProviderFromSettings(settings: ComputeSettings): "gemma-api" | "gemma-vultr" | "claude" {
  if (settings.cloudCompute) {
    return "gemma-vultr";
  }
  return settings.model === "claude" ? "claude" : "gemma-api";
}
