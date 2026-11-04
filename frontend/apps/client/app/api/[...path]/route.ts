import type { NextRequest } from "next/server";
import { forwardToBackend } from "../../../lib/server/forward-to-backend";

// Thin catch-all: every browser call to /api/* is proxied to the NestJS API.
// /api/session is a static route and takes precedence over this one.
type Context = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, { params }: Context) {
  return forwardToBackend(req, (await params).path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

export const dynamic = "force-dynamic";
