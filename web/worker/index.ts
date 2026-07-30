/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const MAXOS_UPSTREAMS = {
  api: "https://btqdrvvitjzwntudtyqr.supabase.co/functions/v1/api",
  chat: "https://btqdrvvitjzwntudtyqr.supabase.co/functions/v1/chat",
} as const;

type MaxosTarget = keyof typeof MAXOS_UPSTREAMS;

function jsonError(error: string, status: number) {
  return Response.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

async function proxyMaxosRequest(request: Request, target: MaxosTarget) {
  if (request.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return jsonError("Cross-site request rejected", 403);
  }

  const ownerKey = request.headers.get("x-maxos-key") ?? "";
  if (!ownerKey) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const upstream = await fetch(MAXOS_UPSTREAMS[target], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-maxos-key": ownerKey,
      },
      body: await request.text(),
      cache: "no-store",
      redirect: "error",
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Never log or echo the owner key. Surface a stable gateway-style error
    // instead of allowing a runtime exception to become an opaque HTTP 500.
    return jsonError("MAXos upstream unavailable", 502);
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle the two MAXos same-origin proxy endpoints at the Worker boundary.
    // This avoids routing production owner-key requests through Vinext's
    // App Router server-function layer, which was throwing HTTP 500 before
    // the outgoing request reached Supabase.
    const maxosMatch = url.pathname.match(/^\/api\/maxos\/(api|chat)\/?$/);
    if (maxosMatch) {
      return proxyMaxosRequest(request, maxosMatch[1] as MaxosTarget);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
