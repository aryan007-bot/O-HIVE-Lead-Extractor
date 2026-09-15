import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const BACKEND_URL = "https://ohive-backend.onrender.com";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(`${BACKEND_URL}/api/v1/health`, {
      signal: controller.signal,
      headers: {
        "Bypass-Tunnel-Reminder": "true",
        "ngrok-skip-browser-warning": "true",
      },
    });

    clearTimeout(timeout);

    const body = await res.json().catch(() => ({ status: "unknown" }));

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      backend: body,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: msg, timestamp: new Date().toISOString() },
      { status: 502 }
    );
  }
}
