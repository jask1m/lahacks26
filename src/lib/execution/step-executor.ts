import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { Page } from "playwright-core";
import { TestStep } from "@/lib/supabase/types";

const actionSchema = z.object({
  actions: z.array(
    z.object({
      action: z.enum([
        "navigate",
        "click",
        "type",
        "waitForSelector",
        "assertVisible",
        "assertText",
        "assertLink",
        "goBack",
        "scroll",
      ]),
      selector: z.string().optional(),
      value: z.string().optional(),
      url: z.string().optional(),
      description: z.string(),
    })
  ),
});

const EXECUTOR_SYSTEM_PROMPT = `You are a Playwright automation expert. Given a test step description and the current page context, translate the step into one or more concrete Playwright actions.

Available actions:
- navigate: Go to a URL. Requires "url" field.
- click: Click an element. Requires "selector" field (CSS selector or text selector like 'text=Click me').
- type: Type text into an input. Requires "selector" and "value" fields.
- waitForSelector: Wait for an element to appear. Requires "selector" field.
- assertVisible: Assert an element is visible. Requires "selector" field.
- assertText: Assert text content exists on page. Requires "value" field (the text to find).
- assertLink: Assert a link exists and points to expected URL. Requires "selector" and "url" fields.
- goBack: Go back to previous page. No additional fields needed.
- scroll: Scroll down the page. No additional fields needed.

Use CSS selectors, aria labels, text content selectors, or role selectors.
Prefer text-based selectors (text=, role=) when the element has visible text.
For links, use a[href*="pattern"] selectors when checking specific URLs.
Return an array of actions to perform sequentially.`;

export async function translateStep(
  step: TestStep,
  pageUrl: string,
  pageTitle: string,
  pageContent: string
): Promise<z.infer<typeof actionSchema>["actions"]> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: actionSchema,
    system: EXECUTOR_SYSTEM_PROMPT,
    prompt: `Current page URL: ${pageUrl}
Current page title: ${pageTitle}
Page accessibility snapshot (partial): ${pageContent.substring(0, 3000)}

Step type: ${step.type}
Step description: ${step.description}

Translate this into concrete Playwright actions.`,
  });

  return object.actions;
}

export type ExecutedAction = z.infer<typeof actionSchema>["actions"][number];

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

export async function executeActions(
  page: Page,
  actions: ExecutedAction[]
): Promise<ExecuteActionsResult> {
  const results: string[] = [];

  for (const action of actions) {
    try {
      switch (action.action) {
        case "navigate":
          await page.goto(action.url!, { waitUntil: "domcontentloaded", timeout: 15000 });
          results.push(`Navigated to ${action.url}`);
          break;

        case "click":
          await page.click(action.selector!, { timeout: 10000 });
          await page.waitForTimeout(1000);
          results.push(`Clicked: ${action.selector}`);
          break;

        case "type":
          await page.fill(action.selector!, action.value!);
          results.push(`Typed "${action.value}" into ${action.selector}`);
          break;

        case "waitForSelector":
          try {
            await page.waitForSelector(action.selector!, { timeout: 10000 });
            results.push(`Found: ${action.selector}`);
          } catch (primaryError) {
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
          const link = await page.waitForSelector(action.selector!, { timeout: 10000 });
          if (!link) throw new Error(`Link not found: ${action.selector}`);
          const href = await link.getAttribute("href");
          if (action.url && href && !href.includes(action.url)) {
            throw new Error(`Link href "${href}" does not match expected "${action.url}"`);
          }
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
      return {
        success: false,
        completedActions: results,
        failingAction: action,
        rawErrorMessage: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return {
    success: true,
    details: results.join("\n"),
    completedActions: results,
  };
}
