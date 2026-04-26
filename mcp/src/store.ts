import { readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { getStateFile } from "./paths.js";
import {
  emptyState,
  type LocalProject,
  type LocalRun,
  type LocalRunStep,
  type LocalTest,
  type StateFile,
} from "./types.js";

/**
 * Serialized in-process mutex. MCP servers are stdio-based and agents only
 * spawn one process at a time, so this is sufficient to prevent torn writes
 * within a single tool invocation chain. We additionally write atomically
 * via tempfile + rename.
 */
let mutex: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = mutex.then(fn, fn);
  // Swallow rejection so the chain keeps moving for subsequent callers.
  mutex = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function readState(): Promise<StateFile> {
  const file = getStateFile();
  if (!existsSync(file)) {
    return emptyState();
  }
  try {
    const raw = await readFile(file, "utf8");
    if (!raw.trim()) return emptyState();
    const parsed = JSON.parse(raw) as Partial<StateFile>;
    return {
      version: 1,
      projects: parsed.projects ?? [],
      tests: parsed.tests ?? [],
      runs: parsed.runs ?? [],
    };
  } catch (err) {
    throw new Error(
      `Failed to read state file at ${file}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

async function writeState(state: StateFile): Promise<void> {
  const file = getStateFile();
  const dir = dirname(file);
  const tmp = join(dir, `state.${process.pid}.${Date.now()}.tmp`);
  await writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await rename(tmp, file);
}

/**
 * Run a read-modify-write transaction against the JSON state file.
 */
export async function mutate<T>(fn: (state: StateFile) => Promise<T> | T): Promise<T> {
  return withLock(async () => {
    const state = await readState();
    const result = await fn(state);
    await writeState(state);
    return result;
  });
}

/**
 * Run a read-only query against the JSON state file.
 */
export async function query<T>(fn: (state: StateFile) => T): Promise<T> {
  return withLock(async () => fn(await readState()));
}

// ---- Project helpers ----

export async function listProjects(): Promise<LocalProject[]> {
  return query((s) => [...s.projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function getProject(projectId: string): Promise<LocalProject | undefined> {
  return query((s) => s.projects.find((p) => p.id === projectId));
}

export async function findProjectByUrl(url: string): Promise<LocalProject | undefined> {
  return query((s) => s.projects.find((p) => p.url === url));
}

export async function insertProject(project: LocalProject): Promise<LocalProject> {
  return mutate((s) => {
    s.projects.push(project);
    return project;
  });
}

export async function deleteProject(projectId: string): Promise<{
  removedTests: number;
  removedRuns: number;
}> {
  return mutate((s) => {
    const before = s.projects.length;
    s.projects = s.projects.filter((p) => p.id !== projectId);
    if (s.projects.length === before) {
      return { removedTests: 0, removedRuns: 0 };
    }
    const testIds = new Set(s.tests.filter((t) => t.projectId === projectId).map((t) => t.id));
    const removedTests = testIds.size;
    s.tests = s.tests.filter((t) => !testIds.has(t.id));
    const beforeRuns = s.runs.length;
    s.runs = s.runs.filter((r) => !testIds.has(r.testId));
    return { removedTests, removedRuns: beforeRuns - s.runs.length };
  });
}

// ---- Test helpers ----

export async function listTests(projectId: string): Promise<LocalTest[]> {
  return query((s) =>
    s.tests
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export async function getTest(testId: string): Promise<LocalTest | undefined> {
  return query((s) => s.tests.find((t) => t.id === testId));
}

export async function insertTest(test: LocalTest): Promise<LocalTest> {
  return mutate((s) => {
    s.tests.push(test);
    return test;
  });
}

export async function updateTestSteps(testId: string, steps: LocalTest["steps"]): Promise<void> {
  await mutate((s) => {
    const test = s.tests.find((t) => t.id === testId);
    if (test) test.steps = steps;
  });
}

export async function getTestsBySuite(suiteId: string): Promise<LocalTest[]> {
  return query((s) =>
    s.tests
      .filter((t) => t.suiteId === suiteId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );
}

export interface SuiteTestOverride {
  testId: string;
  name?: string;
  description?: string;
  steps?: LocalTest["steps"];
}

/**
 * Apply per-test overrides to all tests in a suite. Returns the updated tests
 * (in suite order). Throws if any override references a testId not in the suite.
 */
export async function applyTestOverrides(
  suiteId: string,
  overrides: SuiteTestOverride[]
): Promise<LocalTest[]> {
  return mutate((s) => {
    const suiteTests = s.tests.filter((t) => t.suiteId === suiteId);
    if (suiteTests.length === 0) {
      throw new Error(`No tests found for suiteId: ${suiteId}`);
    }
    const byId = new Map(suiteTests.map((t) => [t.id, t]));
    for (const override of overrides) {
      const test = byId.get(override.testId);
      if (!test) {
        throw new Error(
          `Override references testId ${override.testId} which is not part of suite ${suiteId}`
        );
      }
      if (override.name !== undefined) test.name = override.name;
      if (override.description !== undefined) test.description = override.description;
      if (override.steps !== undefined) test.steps = override.steps;
    }
    return suiteTests
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  });
}

export async function deleteTest(testId: string): Promise<{ removedRuns: number }> {
  return mutate((s) => {
    const before = s.tests.length;
    s.tests = s.tests.filter((t) => t.id !== testId);
    if (s.tests.length === before) return { removedRuns: 0 };
    const beforeRuns = s.runs.length;
    s.runs = s.runs.filter((r) => r.testId !== testId);
    return { removedRuns: beforeRuns - s.runs.length };
  });
}

// ---- Run helpers ----

export async function insertRun(run: LocalRun): Promise<LocalRun> {
  return mutate((s) => {
    s.runs.push(run);
    return run;
  });
}

export async function updateRun(
  runId: string,
  patch: Partial<Omit<LocalRun, "id" | "testId" | "steps">>
): Promise<void> {
  await mutate((s) => {
    const run = s.runs.find((r) => r.id === runId);
    if (run) Object.assign(run, patch);
  });
}

export async function updateRunStep(
  runId: string,
  stepIndex: number,
  patch: Partial<LocalRunStep>
): Promise<void> {
  await mutate((s) => {
    const run = s.runs.find((r) => r.id === runId);
    if (!run) return;
    const step = run.steps.find((st) => st.stepIndex === stepIndex);
    if (step) Object.assign(step, patch);
  });
}

export async function getRun(runId: string): Promise<LocalRun | undefined> {
  return query((s) => s.runs.find((r) => r.id === runId));
}

export async function getLatestRunForTest(testId: string): Promise<LocalRun | undefined> {
  return query((s) =>
    [...s.runs]
      .filter((r) => r.testId === testId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
  );
}
