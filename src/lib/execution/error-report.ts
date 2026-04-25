export const ERROR_REPORT_VERSION = 2;

// Versions of StructuredErrorReport that the runner UI knows how to render.
// V1 records (written before errorClass/stack were introduced) are still
// considered valid input; the parser will normalize them into the current
// shape with the new fields left undefined.
const SUPPORTED_REPORT_VERSIONS: ReadonlySet<number> = new Set([1, 2]);

export interface StructuredErrorReport {
  version: 1 | 2;
  /** JS error class (e.g. "ReferenceError", "TimeoutError"). Optional for V1 records. */
  errorClass?: string;
  repro: string[];
  cause: string;
  fix: string;
  /** Human-readable raw error message, possibly with appended completed-action context. */
  raw: string;
  /** Truncated stack trace (top frames). Optional for V1 records. */
  stack?: string;
}

export function tryParseErrorReport(
  details: string | null | undefined
): StructuredErrorReport | null {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details);
    if (
      parsed &&
      typeof parsed.version === "number" &&
      SUPPORTED_REPORT_VERSIONS.has(parsed.version) &&
      Array.isArray(parsed.repro) &&
      typeof parsed.cause === "string" &&
      typeof parsed.fix === "string"
    ) {
      return parsed as StructuredErrorReport;
    }
  } catch {
    /* fall through */
  }
  return null;
}

export function serializeErrorReport(report: StructuredErrorReport): string {
  return JSON.stringify(report);
}

/**
 * Truncate a stack trace to a fixed number of frames so it stays useful for
 * triage without bloating the persisted record.
 */
export function truncateStack(
  stack: string | undefined,
  maxFrames = 15
): string | undefined {
  if (!stack) return undefined;
  const lines = stack.split("\n");
  if (lines.length <= maxFrames + 1) return stack;
  // Keep the leading "Error: ..." header line plus `maxFrames` frames.
  return [...lines.slice(0, maxFrames + 1), `    ... (${lines.length - maxFrames - 1} more frames)`].join("\n");
}
