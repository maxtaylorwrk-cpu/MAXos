const UPSTREAMS = {
  api: "https://btqdrvvitjzwntudtyqr.supabase.co/functions/v1/api",
  chat: "https://btqdrvvitjzwntudtyqr.supabase.co/functions/v1/chat",
} as const;

type Target = keyof typeof UPSTREAMS;

export async function POST(
  request: Request,
  context: { params: Promise<{ target: string }> },
) {
  const { target } = await context.params;
  if (!Object.hasOwn(UPSTREAMS, target)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return Response.json({ error: "Cross-site request rejected" }, { status: 403 });
  }

  const ownerKey = request.headers.get("x-maxos-key") ?? "";
  if (!ownerKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();
  const upstream = await fetch(UPSTREAMS[target as Target], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-maxos-key": ownerKey,
    },
    body,
    cache: "no-store",
    redirect: "error",
  });

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
