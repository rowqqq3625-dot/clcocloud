import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { createAipDashboardRouter } from './routes/handlers';
import type { RouteRequest } from './routes/types';

const router = createAipDashboardRouter();

export async function handleNextRequest(req: NextRequest, method: string, path: string) {
  let body: unknown = undefined;
  if (method === 'POST') {
    try {
      body = await req.json();
    } catch {
      // Empty or invalid body
    }
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

  const routeReq: RouteRequest = {
    method,
    path,
    body,
    headers,
    ip,
  };

  const response = await router.handle(routeReq);

  const resHeaders = new Headers();
  Object.entries(response.headers).forEach(([key, value]) => {
    resHeaders.set(key, value);
  });

  return new NextResponse(
    typeof response.body === 'string' ? response.body : JSON.stringify(response.body),
    {
      status: response.status,
      headers: resHeaders,
    }
  );
}
