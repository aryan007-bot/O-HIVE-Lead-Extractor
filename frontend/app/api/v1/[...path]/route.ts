import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BACKEND_URL = "https://ohive-backend.onrender.com";

async function handleProxy(req: NextRequest, params: { path?: string[] }) {
  const path = params.path ? params.path.join("/") : "";
  const targetUrl = new URL(`/api/v1/${path}`, BACKEND_URL);

  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const headers = new Headers();
  const allowedHeaders = ["content-type", "accept", "authorization"];
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (allowedHeaders.includes(lower)) {
      headers.set(key, value);
    }
  });

  headers.set("Bypass-Tunnel-Reminder", "true");
  headers.set("ngrok-skip-browser-warning", "true");

  let bodyBuffer: ArrayBuffer | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const buffer = await req.arrayBuffer();
      if (buffer.byteLength > 0) {
        bodyBuffer = buffer;
      }
    } catch {
      // empty body
    }
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const backendRes = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: headers,
        body: bodyBuffer,
        signal: AbortSignal.timeout(45000),
      });

      if (backendRes.status === 503 && attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
        continue;
      }

      const resHeaders = new Headers();
      backendRes.headers.forEach((val, key) => {
        const lower = key.toLowerCase();
        if (lower !== "content-encoding" && lower !== "content-length" && lower !== "transfer-encoding") {
          resHeaders.set(key, val);
        }
      });

      resHeaders.set("Access-Control-Allow-Origin", "*");
      resHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      resHeaders.set("Access-Control-Allow-Headers", "*");

      return new NextResponse(backendRes.body, {
        status: backendRes.status,
        statusText: backendRes.statusText,
        headers: resHeaders,
      });
    } catch (err: unknown) {
      lastError = err;
      if (attempt < 4) {
        const backoff = attempt * 3000;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
  console.error("Proxy error to backend:", errorMsg);
  return NextResponse.json(
    {
      detail: "Backend service is starting up. Render free tier requires ~60s warm-up. Please wait and retry.",
      error: errorMsg,
    },
    {
      status: 503,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Retry-After": "60",
      },
    }
  );
}

export async function GET(req: NextRequest, props: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await props.params;
  return handleProxy(req, resolvedParams);
}

export async function POST(req: NextRequest, props: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await props.params;
  return handleProxy(req, resolvedParams);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await props.params;
  return handleProxy(req, resolvedParams);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await props.params;
  return handleProxy(req, resolvedParams);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await props.params;
  return handleProxy(req, resolvedParams);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
