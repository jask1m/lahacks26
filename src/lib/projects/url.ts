export type ProjectExecutionMode = "browserbase" | "local";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export interface NormalizedProjectUrl {
  name: string;
  url: string;
  executionMode: ProjectExecutionMode;
}

function withDefaultProtocol(input: string): string {
  const trimmed = input.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const protocol = /^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(trimmed)
    ? "http://"
    : "https://";

  return `${protocol}${trimmed}`;
}

export function getProjectExecutionMode(url: URL): ProjectExecutionMode {
  return LOCAL_HOSTNAMES.has(url.hostname) ? "local" : "browserbase";
}

export function getProjectExecutionModeFromString(
  input: string
): ProjectExecutionMode {
  return getProjectExecutionMode(new URL(withDefaultProtocol(input)));
}

export function deriveProjectName(url: URL): string {
  if (LOCAL_HOSTNAMES.has(url.hostname)) {
    return url.port ? `${url.hostname}:${url.port}` : url.hostname;
  }

  return url.hostname.replace(/^www\./, "");
}

export function isLocalUrl(input: string): boolean {
  try {
    const normalizedInput = withDefaultProtocol(input);
    const parsedUrl = new URL(normalizedInput);
    return LOCAL_HOSTNAMES.has(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export function normalizeProjectUrl(
  input: string,
  projectName?: string
): NormalizedProjectUrl {
  const normalizedInput = withDefaultProtocol(input);
  const parsedUrl = new URL(normalizedInput);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Project URL must use http or https");
  }

  const executionMode = getProjectExecutionMode(parsedUrl);

  if (executionMode === "local" && parsedUrl.protocol !== "http:") {
    parsedUrl.protocol = "http:";
  }

  if (executionMode === "local" && !projectName?.trim()) {
    throw new Error("Project name is required for local development URLs");
  }

  const name = projectName?.trim() || deriveProjectName(parsedUrl);

  return {
    name,
    url: parsedUrl.toString(),
    executionMode,
  };
}

export function isLocalExecutionEnabled(): boolean {
  const rawValue = process.env.LOCAL_EXECUTION_ENABLED;

  if (rawValue === undefined) {
    return process.env.NODE_ENV !== "production";
  }

  return rawValue.toLowerCase() === "true";
}
