import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://ohive-backend.onrender.com";

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

  try {
      const backendRes = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: headers,
        body: bodyBuffer,
        signal: AbortSignal.timeout(120000),
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
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Proxy error to backend:", errorMsg);
    return NextResponse.json(
      {
        detail: "Backend service unreachable. Render free tier may be spinning up.",
        error: errorMsg,
      },
      {
        status: 504,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      }
    );
  }
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
