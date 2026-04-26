"use client";

import { useState, useEffect } from "react";
import { Cpu, Cloud, ChevronDown } from "lucide-react";
import {
  getComputeSettings,
  setComputeSettings,
  type ComputeSettings,
  type AIModel,
} from "@/lib/compute-settings";

export default function ComputePage() {
  const [settings, setSettings] = useState<ComputeSettings>({
    model: "gemma",
    cloudCompute: false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(getComputeSettings());
  }, []);

  const handleModelChange = (model: AIModel) => {
    const updated = { ...settings, model };
    setSettings(updated);
    setComputeSettings(updated);
  };

  const handleCloudToggle = () => {
    const updated = { ...settings, cloudCompute: !settings.cloudCompute };
    setSettings(updated);
    setComputeSettings(updated);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-semibold text-foreground flex items-center gap-3">
          <Cpu className="h-6 w-6 text-accent-blue" />
          Compute Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure AI model and cloud compute for test generation
        </p>
      </div>

      <div className="space-y-6">
        {/* Model Selection */}
        <div className="bg-bg-2 border border-border rounded-lg p-5">
          <label className="block text-sm font-medium text-foreground mb-2">
            Model
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Select the AI model for generating and analyzing tests
          </p>

          <div className="relative">
            <select
              value={settings.cloudCompute ? "gemma" : settings.model}
              onChange={(e) => handleModelChange(e.target.value as AIModel)}
              disabled={settings.cloudCompute}
              className={`w-full appearance-none bg-bg-1 border border-border rounded-md px-4 py-2.5 pr-10 text-sm font-medium transition-colors ${
                settings.cloudCompute
                  ? "text-muted-foreground cursor-not-allowed opacity-60"
                  : "text-foreground cursor-pointer hover:border-border-highlight"
              }`}
            >
              <option value="gemma">
                {settings.cloudCompute ? "Gemma (Vultr)" : "Gemma"}
              </option>
              {!settings.cloudCompute && <option value="claude">Claude</option>}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {settings.cloudCompute && (
            <p className="text-xs text-accent-blue mt-2">
              Model locked to Gemma when Cloud Compute is enabled
            </p>
          )}
        </div>

        {/* Cloud Compute Toggle */}
        <div className="bg-bg-2 border border-border rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  settings.cloudCompute
                    ? "bg-accent-green/20 text-accent-green"
                    : "bg-bg-1 text-muted-foreground"
                }`}
              >
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Cloud Compute
                </label>
                <p className="text-xs text-muted-foreground">
                  Run Gemma on dedicated Vultr instance
                </p>
              </div>
            </div>

            <button
              onClick={handleCloudToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.cloudCompute ? "bg-accent-green" : "bg-bg-1 border border-border"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.cloudCompute ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {settings.cloudCompute && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                <span className="text-accent-green font-medium">Connected to Vultr</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Using self-hosted Gemma 27B on CPU instance
              </p>
            </div>
          )}
        </div>

        {/* Current Configuration Summary */}
        <div className="bg-bg-1 border border-border-highlight rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Current Configuration</p>
          <p className="text-sm font-medium text-foreground">
            {settings.cloudCompute ? (
              <>
                <span className="text-accent-green">Gemma</span> on{" "}
                <span className="text-accent-blue">Vultr Cloud</span>
              </>
            ) : (
              <>
                <span className="text-accent-blue">
                  {settings.model === "gemma" ? "Gemma" : "Claude"}
                </span>{" "}
                via API
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
