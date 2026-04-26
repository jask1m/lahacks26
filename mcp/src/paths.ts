import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { mkdirSync } from "node:fs";

const ENV_OVERRIDE = "TESTER_ARMY_STATE_DIR";

function defaultStateDir(): string {
  return join(homedir(), ".tester-army");
}

export function getStateDir(): string {
  const override = process.env[ENV_OVERRIDE];
  const dir = override ? resolve(override) : defaultStateDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getStateFile(): string {
  return join(getStateDir(), "state.json");
}

export function getRunsDir(): string {
  const dir = join(getStateDir(), "runs");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getRunDir(runId: string): string {
  const dir = join(getRunsDir(), runId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getStepScreenshotPath(runId: string, stepIndex: number): string {
  return join(getRunDir(runId), `step-${stepIndex}.png`);
}
