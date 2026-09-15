import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max 60 seconds for VLM processing

async function handleProxy(req: NextRequest, params: { path?: string[] }) {
  const path = params.path ? params.path.join("/") : "";
  const backendBase = process.env.NEXT_PUBLIC_API_URL || "https://ohive-backend.onrender.com";
  const cleanBackend = backendBase.replace(/\/$/, "");
  const targetUrl = new URL(`/api/v1/${path}`, cleanBackend);

  // Preserve query parameters
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "host" && lower !== "connection" && lower !== "content-length") {
      headers.set(key, value);
    }
  });

  // Inject localtunnel / ngrok bypass headers
  headers.set("Bypass-Tunnel-Reminder", "true");
  headers.set("ngrok-skip-browser-warning", "true");

  let bodyBytes: Uint8Array | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const buffer = await req.arrayBuffer();
      if (buffer.byteLength > 0) {
        bodyBytes = new Uint8Array(buffer);
      }
    } catch {
      // empty body
    }
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const backendRes = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: headers,
        body: bodyBytes ? bodyBytes : undefined,
        // @ts-expect-error Next.js fetch duplex support
        duplex: "half",
      });

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
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
  console.error("Proxy error to backend:", errorMsg);
  return NextResponse.json(
    {
      detail: "Backend service temporarily unavailable. Please check if backend daemon is running.",
      error: errorMsg,
    },
    {
      status: 503,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*",
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
