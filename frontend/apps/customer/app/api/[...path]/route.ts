import { NextResponse, type NextRequest } from "next/server";

/**
 * Same-origin proxy for the customer app's PUBLIC calls only. The browser talks
 * to `/api/v1/public/…`; this forwards exactly those paths to the NestJS API
 * with no credentials. Anything else is refused here, so this route can never be
 * used to reach authenticated endpoints.
 */
type Context = { params: Promise<{ path: string[] }> };

const API_URL = () => process.env.API_URL ?? "http://localhost:4000";

async function handle(req: NextRequest, { params }: Context) {
  const path = (await params).path;
  if (path[0] !== "v1" || path[1] !== "public") {
    return NextResponse.json({ title: "Not found", status: 404 }, { status: 404 });
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const upstream = await fetch(`${API_URL()}/api/${path.join("/")}${req.nextUrl.search}`, {
    method: req.method,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: hasBody ? await req.text() : undefined,
    cache: "no-store",
  });

  return new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = handle;
export const POST = handle;

export const dynamic = "force-dynamic";
