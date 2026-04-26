import { generateObject } from "ai";
import { getStructuredModel } from "@/lib/ai/providers";
import { access } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright-core";
import type { TestStep } from "@/lib/supabase/types";
import type {
  AuthSecrets,
  ResolvedAuthConfig,
} from "@/lib/auth/types";
import {
  executableActionsSchema,
  type ExecutableAction,
} from "./actions";

export type { ExecutableAction } from "./actions";

const EXECUTOR_SYSTEM_PROMPT = `You are a Playwright automation expert. Given a failing step and a compact page snapshot, translate the step into a small sequence of concrete actions.

Available actions:
- navigate: Go to a URL. Requires "url".
- click: Click an element. Requires "selector".
- type: Type text into an input. Requires "selector" and "value".
- uploadFile: Upload a file using an <input type="file">. Requires "selector" and "value" (file path).
- waitForSelector: Wait for an element to appear. Requires "selector".
- assertVisible: Assert an element is visible. Requires "selector".
- assertText: Assert text content exists on page. Requires "value".
- assertLink: Assert a link exists and points to expected URL. Requires "selector" and "url".
- goBack: Go back to previous page.
- scroll: Scroll down the page.

Rules:
- Use the smallest reliable action set.
- Prefer selectors that appear in the provided page snapshot.
- Prefer text=, role=, labels, and placeholders over brittle CSS.
- If the step is an assertion about text, use assertText when possible.`;

interface PageSnapshot {
  url: string;
  title: string;
  visibleText: string[];
  buttons: string[];
  links: Array<{ text: string; href: string }>;
  inputs: string[];
}

export interface ExecutionResult {
  success: boolean;
  details: string;
  completedActions: string[];
  /**
   * Populated when `success` is false. The translated action that triggered
   * the failure. Engine code uses this to build a structured failure report.
   */
  failingAction?: ExecutableAction;
  /**
   * Populated when `success` is false. The raw error message from the
   * underlying action (e.g. Playwright timeout text), unwrapped from any
   * wrapper messages added by the executor.
   */
  rawErrorMessage?: string;
}

/**
 * Mutable reference shared between the engine and {@link executeActions} so
 * the engine can recover what was being attempted when an unexpected error
 * escapes (e.g. a JS error thrown outside the per-action try/catch).
 *
 * `executeActions` updates `lastAttempted` immediately before each action
 * starts and appends to `completed` after each action succeeds.
 */
export interface ActionProgress {
  lastAttempted: ExecutableAction | null;
  completed: string[];
}

interface InputMetadata {
  selector: string;
  type: string;
  name: string;
  placeholder: string;
  autocomplete: string;
  label: string;
}

interface AuthIdentity {
  username: string;
  email: string;
  password: string;
}

function splitSelectorCandidates(selector: string): string[] {
  const candidates: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let depth = 0;

  for (const char of selector) {
    if (quote) {
      current += char;
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(") {
      depth += 1;
      current += char;
      continue;
    }

    if (char === ")") {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }

    if (char === "," && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) {
        candidates.push(trimmed);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed) {
    candidates.push(trimmed);
  }

  return candidates;
}

function normalizeSelectorCandidate(selector: string): string {
  return selector
    .trim()
    .replace(
      /:contains\((['"])(.*?)\1\)/g,
      (_, __, text: string) => `:has-text("${text.replace(/"/g, '\\"')}")`
    );
}

function getSelectorCandidates(selector: string): string[] {
  const candidates = splitSelectorCandidates(selector)
    .map(normalizeSelectorCandidate)
    .filter(Boolean);

  return candidates.length ? candidates : [normalizeSelectorCandidate(selector)];
}

async function clickSelector(page: Page, selector: string) {
  const candidates = getSelectorCandidates(selector);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const locator = page.locator(candidate).first();
      await locator.waitFor({ timeout: 5000, state: "visible" });
      await locator.click({ timeout: 5000 });
      return candidate;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown click selector error");
    }
  }

  throw lastError ?? new Error(`No clickable selector matched: ${selector}`);
}

async function fillSelector(page: Page, selector: string, value: string) {
  const candidates = getSelectorCandidates(selector);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const locator = page.locator(candidate).first();
      await locator.waitFor({ timeout: 5000, state: "visible" });
      await locator.fill(value, { timeout: 5000 });
      return candidate;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown fill selector error");
    }
  }

  throw lastError ?? new Error(`No fillable selector matched: ${selector}`);
}

async function waitForSelectorMatch(
  page: Page,
  selector: string,
  state: "attached" | "visible" = "attached"
) {
  const candidates = getSelectorCandidates(selector);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const locator = page.locator(candidate).first();
      await locator.waitFor({ timeout: 5000, state });
      return candidate;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Unknown waitForSelector error");
    }
  }

  throw lastError ?? new Error(`No selector matched: ${selector}`);
}

async function assertLinkMatch(page: Page, selector: string, expectedUrl?: string) {
  const candidates = getSelectorCandidates(selector);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const locator = page.locator(candidate).first();
      await locator.waitFor({ timeout: 5000, state: "attached" });
      const href = await locator.getAttribute("href");

      if (expectedUrl && href && !href.includes(expectedUrl)) {
        throw new Error(
          `Link href "${href}" does not match expected "${expectedUrl}"`
        );
      }

      return { candidate, href };
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown assertLink error");
    }
  }

  throw lastError ?? new Error(`No link selector matched: ${selector}`);
}

async function getVisibleInputs(page: Page): Promise<InputMetadata[]> {
  return page.evaluate(() => {
    const normalize = (value: string | null | undefined) =>
      value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";

    const getLabel = (input: HTMLInputElement | HTMLTextAreaElement) => {
      const ariaLabel = normalize(input.getAttribute("aria-label"));
      if (ariaLabel) return ariaLabel;

      const id = input.getAttribute("id");
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label?.textContent) return normalize(label.textContent);
      }

      const wrappingLabel = input.closest("label");
      if (wrappingLabel?.textContent) return normalize(wrappingLabel.textContent);

      return "";
    };

    const isVisible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element as HTMLElement);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
    };

    return Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea"
      )
    )
      .filter((input) => !input.disabled && isVisible(input))
      .map((input) => {
        const tag = input.tagName.toLowerCase();
        const type = tag === "textarea" ? "textarea" : normalize(input.type || "text");
        const name = normalize(input.name);
        const placeholder = normalize(input.placeholder);
        const autocomplete = normalize(input.autocomplete);
        const label = getLabel(input);
        const id = input.getAttribute("id");
        const selector = id
          ? `#${CSS.escape(id)}`
          : tag === "textarea"
          ? `textarea${input.name ? `[name="${input.name}"]` : ""}`
          : `input${input.name ? `[name="${input.name}"]` : type ? `[type="${input.type}"]` : ""}`;

        return {
          selector,
          type,
          name,
          placeholder,
          autocomplete,
          label,
        };
      });
  });
}

function scoreInput(input: InputMetadata, patterns: RegExp[], typeBoosts: string[] = []) {
  const haystack = [
    input.name,
    input.placeholder,
    input.autocomplete,
    input.label,
  ].join(" ");
  let score = 0;

  for (const pattern of patterns) {
    if (pattern.test(haystack)) {
      score += 10;
    }
  }

  if (typeBoosts.includes(input.type)) {
    score += 3;
  }

  return score;
}

function pickBestInput(
  inputs: InputMetadata[],
  patterns: RegExp[],
  typeBoosts: string[] = [],
  excludeSelectors = new Set<string>()
) {
  const ranked = inputs
    .filter((input) => !excludeSelectors.has(input.selector))
    .map((input) => ({
      input,
      score: scoreInput(input, patterns, typeBoosts),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.find((entry) => entry.score > 0)?.input ?? null;
}

async function clickFirstVisible(page: Page, selectors: string[], description: string) {
  let lastError: Error | null = null;

  for (const selector of selectors) {
    try {
      const candidate = await clickSelector(page, selector);
      return `${description}: ${candidate}`;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown click error");
    }
  }

  throw lastError ?? new Error(`Could not ${description.toLowerCase()}`);
}

async function waitForAuthCompletion(page: Page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => null);

  const successTextPatterns = [
    /dashboard/i,
    /logout/i,
    /log out/i,
    /my account/i,
    /profile/i,
    /welcome/i,
    /authenticated/i,
  ];
  const loginTextPatterns = [
    /sign in/i,
    /log in/i,
    /welcome back/i,
  ];

  for (let attempt = 0; attempt < 10; attempt++) {
    const currentUrl = page.url();
    const bodyText = (await page.textContent("body").catch(() => "")) || "";

    if (
      successTextPatterns.some((pattern) => pattern.test(bodyText)) ||
      /dashboard|account|profile/.test(currentUrl)
    ) {
      return "authenticated";
    }

    if (
      /login|signin|sign-in/.test(currentUrl) ||
      loginTextPatterns.some((pattern) => pattern.test(bodyText))
    ) {
      return "login";
    }

    await page.waitForTimeout(750);
  }

  return "unknown";
}

async function tryDeterministicLogin(
  page: Page,
  credentials: AuthSecrets
): Promise<ExecutionResult> {
  const identity = getAuthIdentity(credentials);
  const inputs = await getVisibleInputs(page);
  const usedSelectors = new Set<string>();
  const completedActions: string[] = [];

  const emailInput = pickBestInput(
    inputs,
    [/email/, /e-mail/],
    ["email", "text"]
  );
  const usernameInput =
    emailInput ??
    pickBestInput(inputs, [/username/, /user name/, /login/], ["text"]);
  const passwordInput = pickBestInput(
    inputs,
    [/password/],
    ["password"]
  );

  if (!usernameInput || !passwordInput) {
    return {
      success: false,
      details: "Could not find login fields.",
      completedActions,
    };
  }

  const loginIdentifier =
    usernameInput.type === "email" ||
    /email|e-mail/.test(
      [usernameInput.name, usernameInput.placeholder, usernameInput.label].join(" ")
    )
      ? identity.email
      : identity.username;

  await page.locator(usernameInput.selector).first().fill(loginIdentifier);
  completedActions.push(`Typed "${loginIdentifier}" into ${usernameInput.selector}`);
  usedSelectors.add(usernameInput.selector);

  await page.locator(passwordInput.selector).first().fill(identity.password);
  completedActions.push(`Typed password into ${passwordInput.selector}`);
  usedSelectors.add(passwordInput.selector);

  completedActions.push(
    await clickFirstVisible(
      page,
      [
        'button:has-text("Log In")',
        'button:has-text("Sign In")',
        'button[type="submit"]',
        'input[type="submit"]',
      ],
      "Submit login form"
    )
  );

  const state = await waitForAuthCompletion(page);
  if (state !== "authenticated") {
    return {
      success: false,
      details: "Login submission did not reach an authenticated state.",
      completedActions,
    };
  }

  return {
    success: true,
    details: "Logged into the authenticated app.",
    completedActions,
  };
}

async function tryDeterministicSignupAndLogin(
  page: Page,
  credentials: AuthSecrets
): Promise<ExecutionResult> {
  const identity = getAuthIdentity(credentials);
  const completedActions: string[] = [];

  if (!/signup|register|create-account/.test(page.url())) {
    try {
      completedActions.push(
        await clickFirstVisible(
          page,
          [
            'a[href*="signup"]',
            'a[href*="register"]',
            'a:has-text("Create account")',
            'a:has-text("Sign Up")',
            'button:has-text("Create account")',
            'button:has-text("Sign Up")',
          ],
          "Open signup page"
        )
      );
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    } catch {
      // Stay on current page and try to use whatever signup fields are already visible.
    }
  }

  const inputs = await getVisibleInputs(page);
  const usedSelectors = new Set<string>();

  const usernameInput = pickBestInput(
    inputs,
    [/username/, /user name/],
    ["text"],
    usedSelectors
  );
  if (usernameInput) {
    await page.locator(usernameInput.selector).first().fill(identity.username);
    completedActions.push(`Typed "${identity.username}" into ${usernameInput.selector}`);
    usedSelectors.add(usernameInput.selector);
  }

  const emailInput = pickBestInput(
    inputs,
    [/email/, /e-mail/],
    ["email", "text"],
    usedSelectors
  );
  if (emailInput) {
    await page.locator(emailInput.selector).first().fill(identity.email);
    completedActions.push(`Typed "${identity.email}" into ${emailInput.selector}`);
    usedSelectors.add(emailInput.selector);
  }

  const passwordInput = pickBestInput(
    inputs,
    [/password/],
    ["password"],
    usedSelectors
  );
  if (!passwordInput) {
    return {
      success: false,
      details: "Could not find the signup password field.",
      completedActions,
    };
  }

  await page.locator(passwordInput.selector).first().fill(identity.password);
  completedActions.push(`Typed password into ${passwordInput.selector}`);
  usedSelectors.add(passwordInput.selector);

  const confirmPasswordInput = pickBestInput(
    inputs,
    [/confirm password/, /password confirmation/, /repeat password/, /confirm/],
    ["password"],
    usedSelectors
  );
  if (confirmPasswordInput) {
    await page.locator(confirmPasswordInput.selector).first().fill(identity.password);
    completedActions.push(`Typed password confirmation into ${confirmPasswordInput.selector}`);
    usedSelectors.add(confirmPasswordInput.selector);
  }

  completedActions.push(
    await clickFirstVisible(
      page,
      [
        'button:has-text("Create Account")',
        'button:has-text("Create account")',
        'button:has-text("Sign Up")',
        'button:has-text("Register")',
        'button[type="submit"]',
        'input[type="submit"]',
      ],
      "Submit signup form"
    )
  );

  const state = await waitForAuthCompletion(page);
  if (state === "unknown") {
    const bodyText = ((await page.textContent("body").catch(() => "")) || "").toLowerCase();
    if (
      /please match|required|invalid|already exists|already taken|error/.test(bodyText) ||
      /signup|register/.test(page.url())
    ) {
      return {
        success: false,
        details:
          "Signup form was submitted, but the page stayed on registration with validation or incomplete state.",
        completedActions,
      };
    }
  }

  if (state === "authenticated") {
    return {
      success: true,
      details: "Created a new account and reached an authenticated state.",
      completedActions,
    };
  }

  if (state === "login") {
    const loginResult = await tryDeterministicLogin(page, credentials);
    return {
      success: loginResult.success,
      details: loginResult.success
        ? "Created a new account and logged in."
        : loginResult.details,
      completedActions: [...completedActions, ...loginResult.completedActions],
    };
  }

  return {
    success: false,
    details: "Signup submission did not reach a login page or authenticated state.",
    completedActions,
  };
}

function getAuthIdentity(credentials: AuthSecrets): AuthIdentity {
  const base =
    credentials.username
      .toLowerCase()
      .replace(/@.*$/, "")
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 16) || "qauser";

  const email = credentials.username.includes("@")
    ? credentials.username
    : `${base}@example.com`;

  return {
    username: base,
    email,
    password: credentials.password,
  };
}

async function executeModelAuthPlan(
  page: Page,
  authConfig: ResolvedAuthConfig,
  websiteUrl: string,
  credentials: AuthSecrets
) {
  const snapshot = await getCompactPageSnapshot(page);
  const { object } = await generateObject({
    model: await getStructuredModel(),
    schema: executableActionsSchema,
    system: `You build deterministic browser actions for a workflow auth block.

Available actions:
- navigate, click, type, waitForSelector, assertVisible, assertText, assertLink, goBack, scroll

Rules:
- The auth block must end in an authenticated state.
- For "existing_login", use the supplied credentials to log in to an existing account.
- For "create_then_remember", create a new account if no account exists yet, then end logged in.
- For "create_every_run", always create a fresh account, then end logged in.
- For signup flows, fill every required visible field before submitting.
- If the page contains a confirm password / repeat password / password confirmation field, fill it with the same password.
- If the site redirects to a login page after signup, continue by logging in with the same credentials.
- Prefer waiting for visible text, a login page, a dashboard, or a URL change after submit.
- Avoid generic selectors like ".success" unless that exact selector is clearly present in the snapshot.
- Prefer stable selectors from the page snapshot.
- Use the provided credentials exactly as written.
- Keep the sequence compact but complete.`,
    prompt: `Website: ${websiteUrl}
Current page snapshot:
${JSON.stringify(snapshot, null, 2)}

Auth strategy: ${authConfig.config.strategy}
Auth goal: ${authConfig.config.prompt}
Username to use: ${credentials.username}
Password to use: ${credentials.password}

Return the action sequence for the full auth block.`,
  });

  return executeActions(page, object.actions);
}

async function getCompactPageSnapshot(page: Page): Promise<PageSnapshot> {
  const title = await page.title();

  const snapshot = await page.evaluate(() => {
    const normalize = (value: string | null | undefined) =>
      value?.replace(/\s+/g, " ").trim() ?? "";
    const unique = <T,>(values: T[]) =>
      Array.from(new Set(values.filter(Boolean))) as T[];

    const visibleText = unique(
      normalize(document.body?.innerText)
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 12)
    );

    const buttons = unique(
      Array.from(
        document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
          'button, [role="button"], input[type="submit"], input[type="button"]'
        )
      )
        .map((element) =>
          normalize(
            element.getAttribute("aria-label") ||
              element.textContent ||
              element.getAttribute("value")
          )
        )
        .filter((text) => text.length > 0)
        .slice(0, 10)
    );

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a"))
      .map((link) => ({
        text: normalize(link.textContent || link.getAttribute("aria-label")),
        href: normalize(link.getAttribute("href")),
      }))
      .filter((link) => link.text || link.href)
      .slice(0, 10);

    const inputs = unique(
      Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          "input, textarea"
        )
      )
        .map((input) =>
          normalize(
            input.getAttribute("placeholder") ||
              input.getAttribute("aria-label") ||
              input.getAttribute("name") ||
              input.getAttribute("type")
          )
        )
        .filter((text) => text.length > 0)
        .slice(0, 8)
    );

    return {
      visibleText,
      buttons,
      links,
      inputs,
    };
  });

  return {
    url: page.url(),
    title,
    ...snapshot,
  };
}

function isRecoverableActionFailure(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("selector") ||
    lower.includes("strict mode violation") ||
    lower.includes("element not visible") ||
    lower.includes("timeout") ||
    lower.includes("not found")
  );
}

export function shouldUseFallback(
  step: TestStep,
  details: string,
  usedCompiledActions: boolean
) {
  return (
    step.type !== "auth" &&
    step.fallbackPolicy !== "none" &&
    usedCompiledActions &&
    isRecoverableActionFailure(details)
  );
}

export async function translateStepWithFallback(
  page: Page,
  step: TestStep
): Promise<ExecutableAction[]> {
  const snapshot = await getCompactPageSnapshot(page);
  const { object } = await generateObject({
    model: await getStructuredModel(),
    schema: executableActionsSchema,
    system: EXECUTOR_SYSTEM_PROMPT,
    prompt: `Current page snapshot:
${JSON.stringify(snapshot, null, 2)}

Step type: ${step.type}
Step description: ${step.description}

Translate this single failing step into fallback actions.`,
  });

  return object.actions;
}

export type ExecutedAction = ExecutableAction;

export type ExecuteActionsResult =
  | {
      success: true;
      details: string;
      completedActions: string[];
    }
  | {
      success: false;
      completedActions: string[];
      failingAction: ExecutedAction;
      rawErrorMessage: string;
    };

function normalizeTextForMatch(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function buildFallbackSelectors(selector: string): string[] {
  const selectorParts = selector
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const fallbacks = new Set<string>(selectorParts);

  if (/product-details|product-info|product-detail/i.test(selector)) {
    fallbacks.add("[data-testid='product-title']");
    fallbacks.add("[data-testid='product-price']");
    fallbacks.add("[data-testid='product-add-cart']");
    fallbacks.add("text=Add to Cart");
  }

  return Array.from(fallbacks);
}

function isFileInputSelector(selector: string): boolean {
  const normalized = selector.toLowerCase();
  return (
    normalized.includes("input[type='file']") ||
    normalized.includes('input[type="file"]') ||
    normalized.includes("[type='file']") ||
    normalized.includes('[type="file"]') ||
    normalized.includes("upload-input")
  );
}

async function resolveUploadFilePath(filePath: string): Promise<string> {
  const trimmedPath = filePath.trim();
  if (!trimmedPath) {
    throw new Error("Upload file path is required.");
  }

  const resolvedPath = path.isAbsolute(trimmedPath)
    ? trimmedPath
    : path.resolve(process.cwd(), trimmedPath);

  try {
    await access(resolvedPath);
  } catch {
    throw new Error(`Upload file not found: ${resolvedPath}`);
  }

  return resolvedPath;
}

async function setInputFilesBySelector(
  page: Page,
  selector: string,
  filePath: string
): Promise<string> {
  const candidates = splitSelectorCandidates(selector);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const locator = page.locator(candidate).first();
      if ((await locator.count()) === 0) {
        continue;
      }

      await locator.setInputFiles(filePath);
      return candidate;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown upload selector error");
    }
  }

  throw lastError ?? new Error(`No file input selector matched: ${selector}`);
}

export async function executeActions(
  page: Page,
  actions: ExecutableAction[],
  progress?: ActionProgress
): Promise<ExecutionResult> {
  const results: string[] = [];

  for (const action of actions) {
    if (progress) progress.lastAttempted = action;
    try {
      switch (action.action) {
        case "navigate":
          await page.goto(action.url!, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          results.push(`Navigated to ${action.url}`);
          break;

        case "click":
          action.selector = await clickSelector(page, action.selector!);
          await page.waitForTimeout(1000);
          results.push(`Clicked: ${action.selector}`);
          break;

        case "type":
          action.selector = await fillSelector(page, action.selector!, action.value!);
          results.push(`Typed "${action.value}" into ${action.selector}`);
          break;

        case "uploadFile": {
          if (!action.selector) {
            throw new Error("uploadFile action requires a selector.");
          }
          if (!action.value) {
            throw new Error("uploadFile action requires a file path in value.");
          }

          const resolvedPath = await resolveUploadFilePath(action.value);
          action.selector = await setInputFilesBySelector(
            page,
            action.selector,
            resolvedPath
          );
          results.push(`Uploaded file: ${resolvedPath} into ${action.selector}`);
          break;
        }

        case "waitForSelector":
          try {
            await page.waitForSelector(action.selector!, { timeout: 10000 });
            results.push(`Found: ${action.selector}`);
          } catch (primaryError) {
            if (isFileInputSelector(action.selector!)) {
              try {
                await page.waitForSelector(action.selector!, {
                  timeout: 10000,
                  state: "attached",
                });
                results.push(`Found (attached file input): ${action.selector}`);
                break;
              } catch {
                // Continue into existing fallback logic if attached lookup also fails.
              }
            }

            const fallbackSelectors = buildFallbackSelectors(action.selector!);
            let matchedFallback: string | null = null;

            for (const fallback of fallbackSelectors) {
              try {
                const element = await page.waitForSelector(fallback, {
                  timeout: 2500,
                  state: "visible",
                });
                if (element) {
                  matchedFallback = fallback;
                  break;
                }
              } catch {
                // Try next fallback selector.
              }
            }

            if (!matchedFallback) {
              const message =
                primaryError instanceof Error
                  ? primaryError.message
                  : `Selector not found: ${action.selector}`;
              throw new Error(message);
            }

            results.push(`Found (fallback): ${action.selector} -> ${matchedFallback}`);
          }
          break;

        case "assertVisible": {
          const selector = action.selector!;
          try {
            const element = await page.waitForSelector(selector, {
              timeout: 10000,
              state: "visible",
            });
            if (!element) throw new Error(`Element not visible: ${selector}`);
            results.push(`Verified visible: ${selector}`);
          } catch (primaryError) {
            const fallbackSelectors = buildFallbackSelectors(selector);
            let matchedFallback: string | null = null;

            for (const fallback of fallbackSelectors) {
              try {
                const element = await page.waitForSelector(fallback, {
                  timeout: 2500,
                  state: "visible",
                });
                if (element) {
                  matchedFallback = fallback;
                  break;
                }
              } catch {
                // Try next fallback selector.
              }
            }

            if (!matchedFallback) {
              const message =
                primaryError instanceof Error
                  ? primaryError.message
                  : `Element not visible: ${selector}`;
              throw new Error(message);
            }

            results.push(
              `Verified visible (fallback): ${selector} -> ${matchedFallback}`
            );
          }
          break;
        }

        case "assertText": {
          const bodyText = await page.textContent("body");
          const actual = normalizeTextForMatch(bodyText ?? "");
          const expected = normalizeTextForMatch(action.value ?? "");
          if (!expected || !actual.includes(expected)) {
            throw new Error(`Text not found on page: "${action.value}"`);
          }
          results.push(`Verified text: "${action.value}"`);
          break;
        }

        case "assertLink": {
          const { candidate, href } = await assertLinkMatch(
            page,
            action.selector!,
            action.url
          );
          action.selector = candidate;
          results.push(`Verified link: ${action.selector} -> ${href}`);
          break;
        }

        case "goBack":
          await page.goBack({ waitUntil: "domcontentloaded" });
          results.push("Navigated back");
          break;

        case "scroll":
          await page.evaluate(() => window.scrollBy(0, 500));
          results.push("Scrolled down");
          break;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        details: `Failed at "${action.description}": ${err instanceof Error ? err.message : String(err)}`,
        completedActions: results,
        failingAction: action,
        rawErrorMessage: message,
      };
    }
    if (progress) progress.completed.push(results[results.length - 1]);
  }

  return {
    success: true,
    details: results.join("\n"),
    completedActions: results,
  };
}

export async function executeAuthStep(
  page: Page,
  params: {
    authConfig: ResolvedAuthConfig;
    websiteUrl: string;
    credentials: AuthSecrets;
  }
): Promise<ExecutionResult> {
  try {
    const { authConfig, websiteUrl, credentials } = params;
    await page.goto(websiteUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    const result =
      authConfig.config.strategy === "existing_login"
        ? await executeModelAuthPlan(page, authConfig, websiteUrl, credentials)
        : await tryDeterministicSignupAndLogin(page, credentials);

    const finalResult =
      result.success ||
      authConfig.config.strategy === "existing_login"
        ? result
        : await executeModelAuthPlan(page, authConfig, websiteUrl, credentials);
    if (!finalResult.success) {
      return finalResult;
    }

    const details = `Authenticated via ${authConfig.config.strategy} (${authConfig.usernameHint ?? credentials.username})`;

    return {
      success: true,
      details,
      completedActions: finalResult.completedActions.length
        ? finalResult.completedActions
        : [details],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown auth error";
    return {
      success: false,
      details: `Failed to authenticate using configured auth: ${message}`,
      completedActions: [],
    };
  }
}
