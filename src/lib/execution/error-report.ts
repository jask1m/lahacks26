export const ERROR_REPORT_VERSION = 1;

export interface StructuredErrorReport {
  version: 1;
  repro: string[];
  cause: string;
  fix: string;
  raw: string;
}

export function tryParseErrorReport(
  details: string | null | undefined
): StructuredErrorReport | null {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details);
    if (
      parsed &&
      parsed.version === ERROR_REPORT_VERSION &&
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
