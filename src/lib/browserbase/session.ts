import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
});

export async function createBrowserSession() {
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
  });

  const debugUrls = await bb.sessions.debug(session.id);

  return {
    sessionId: session.id,
    connectUrl: session.connectUrl,
    liveViewUrl: debugUrls.debuggerFullscreenUrl,
  };
}

export async function stopBrowserSession(sessionId: string) {
  try {
    await bb.sessions.update(sessionId, { status: "REQUEST_RELEASE" });
  } catch {
    // Session may already be stopped; ignore.
  }
}
