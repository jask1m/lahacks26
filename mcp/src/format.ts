import type { StructuredErrorReport } from "@/lib/execution/error-report";

export interface RunReportTestResult {
  testId: string;
  name: string;
  status: "passed" | "failed";
  recordingUrl?: string;
  liveViewUrl?: string;
  steps: unknown;
  screenshotPaths: string[];
  failure?: StructuredErrorReport | unknown;
}

export interface RunReportPayload {
  suiteId: string;
  summary: { total: number; passed: number; failed: number };
  results: RunReportTestResult[];
}

const CONSOLE_ERROR_MAX_CHARS = 200;

// Patterns that indicate the raw error string carries no useful signal beyond
// what's already in `cause` (so we omit the Console error section entirely).
const GENERIC_RAW_PATTERNS: ReadonlyArray<RegExp> = [
  /^step failed without an error message/i,
  /^automatic analysis (timed out|was unavailable|is unavailable)/i,
];

function isStructuredFailure(value: unknown): value is StructuredErrorReport {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as StructuredErrorReport).repro) &&
    typeof (value as StructuredErrorReport).cause === "string" &&
    typeof (value as StructuredErrorReport).fix === "string"
  );
}

function firstNonEmptyLine(text: string): string {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

function consoleErrorLine(failure: StructuredErrorReport): string | null {
  const raw = (failure.raw ?? "").trim();
  if (!raw) return null;

  const firstLine = firstNonEmptyLine(raw);
  if (!firstLine) return null;

  const cause = (failure.cause ?? "").trim();
  if (cause && firstLine === cause) return null;

  for (const pattern of GENERIC_RAW_PATTERNS) {
    if (pattern.test(firstLine)) return null;
  }

  const prefix = failure.errorClass ? `${failure.errorClass}: ` : "";
  // If errorClass is already the leading token in the raw line, don't double it.
  const alreadyPrefixed =
    failure.errorClass && firstLine.toLowerCase().startsWith(`${failure.errorClass.toLowerCase()}:`);
  const composed = alreadyPrefixed ? firstLine : `${prefix}${firstLine}`;
  return truncate(composed, CONSOLE_ERROR_MAX_CHARS);
}

function renderPassingTest(index: number, t: RunReportTestResult): string {
  const recording = t.recordingUrl ?? "(unavailable)";
  return `Test ${index}: ${t.name} — PASSED. Recording: ${recording}`;
}

function renderFailingTest(index: number, t: RunReportTestResult): string {
  const lines: string[] = [];
  lines.push(`Test ${index}: ${t.name} — FAILED`);
  lines.push("");

  const failure = isStructuredFailure(t.failure) ? t.failure : null;

  lines.push("What happened & how to reproduce:");
  if (failure && failure.repro.length > 0) {
    failure.repro.forEach((item, i) => {
      lines.push(`  ${i + 1}. ${item}`);
    });
  } else {
    lines.push("  1. (no reproduction steps available)");
  }
  lines.push("");

  lines.push("Why it failed:");
  lines.push(`  ${failure?.cause?.trim() || "(cause unavailable)"}`);
  lines.push("");

  lines.push("How to fix:");
  lines.push(`  ${failure?.fix?.trim() || "(no suggested fix available)"}`);
  lines.push("");

  if (failure) {
    const consoleLine = consoleErrorLine(failure);
    if (consoleLine) {
      lines.push("Console error:");
      lines.push(`  ${consoleLine}`);
      lines.push("");
    }
  }

  lines.push(`Recording: ${t.recordingUrl ?? "(unavailable)"}`);
  return lines.join("\n");
}

/**
 * Pre-renders the user-facing report for a `run_tests` response. The MCP
 * server emits this as the first text content block so clients display the
 * spec'd format inline regardless of how the agent paraphrases.
 */
export function formatRunReport(payload: RunReportPayload): string {
  const blocks: string[] = [];
  payload.results.forEach((result, idx) => {
    const block =
      result.status === "passed"
        ? renderPassingTest(idx + 1, result)
        : renderFailingTest(idx + 1, result);
    blocks.push(block);
  });

  const { passed, failed, total } = payload.summary;
  blocks.push(`Suite: ${passed} passed / ${failed} failed of ${total}`);

  return blocks.join("\n\n");
}
