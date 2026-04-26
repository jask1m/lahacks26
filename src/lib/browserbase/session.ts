import Browserbase from "@browserbasehq/sdk";

let cachedClient: Browserbase | null = null;

function getClient(): Browserbase {
  if (!cachedClient) {
    cachedClient = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY!,
    });
  }
  return cachedClient;
}

export function buildSessionReplayUrl(sessionId: string): string {
  return `https://www.browserbase.com/sessions/${sessionId}`;
}

export async function createBrowserSession() {
  const bb = getClient();
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
  });

  const debugUrls = await bb.sessions.debug(session.id);

  return {
    sessionId: session.id,
    connectUrl: session.connectUrl,
    liveViewUrl: debugUrls.debuggerFullscreenUrl,
    sessionReplayUrl: buildSessionReplayUrl(session.id),
  };
}

export async function stopBrowserSession(sessionId: string) {
  try {
    await getClient().sessions.update(sessionId, { status: "REQUEST_RELEASE" });
  } catch {
    // Session may already be stopped; ignore.
  }
}
