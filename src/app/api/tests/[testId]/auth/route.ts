import { NextResponse } from "next/server";
import {
  getTestAuthConfig,
  getTestAuthRow,
  upsertTestAuthConfig,
} from "@/lib/auth/storage";
import { testAuthPayloadSchema } from "@/lib/auth/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;

  try {
    const config = await getTestAuthConfig(testId);
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load test auth config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;

  try {
    const body = testAuthPayloadSchema.parse(await req.json());
    const existing = await getTestAuthConfig(testId);
    const existingStep = await getTestAuthRow(testId);

    if (body.mode === "configured") {
      if (!body.config) {
        return NextResponse.json(
          { error: "Configured auth requires a strategy." },
          { status: 400 }
        );
      }

      const needsCredentials = body.config.strategy === "existing_login";
      const hasNewUsername = Boolean(body.credentials?.username?.trim());
      const hasNewPassword = Boolean(body.credentials?.password?.trim());
      const mergedCredentials =
        body.config.strategy === "create_every_run"
          ? null
          : {
              username:
                body.credentials?.username?.trim() ??
                existingStep?.authCredentials?.username ??
                "",
              password:
                body.credentials?.password?.trim() ??
                existingStep?.authCredentials?.password ??
                "",
            };

      if (
        needsCredentials &&
        (!mergedCredentials?.username || !mergedCredentials.password)
      ) {
        return NextResponse.json(
          { error: "Existing-account auth requires username and password." },
          { status: 400 }
        );
      }

      await upsertTestAuthConfig({
        testId,
        mode: "configured",
        config: body.config,
        credentials:
          mergedCredentials?.username && mergedCredentials.password
            ? mergedCredentials
            : null,
        credentialSource:
          body.config.strategy === "create_every_run"
            ? null
            : body.config.strategy === "existing_login"
            ? hasNewUsername || hasNewPassword
              ? "manual"
              : existing.authConfig?.credentialSource ?? "manual"
            : existing.authConfig?.credentialSource ?? null,
      });
    } else {
      await upsertTestAuthConfig({ testId, mode: "none" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save test auth config";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;

  try {
    await upsertTestAuthConfig({ testId, mode: "none" });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear test auth config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
