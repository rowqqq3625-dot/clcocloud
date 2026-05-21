import 'server-only';

import { createAipDashboardRouter } from './handlers';
import type { AipRouteDeps, MountableApp, RouteRequest, RouteResponse } from './types';

interface MountOptions {
  basePath: string;
  deps?: Partial<AipRouteDeps>;
}

function normalizeBasePath(basePath: string): string {
  return `/${basePath.replace(/^\/+|\/+$/g, '')}`;
}

function toRouteRequest(method: string, path: string, req: unknown): RouteRequest {
  const record = req as {
    body?: unknown;
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
  };

  return {
    method,
    path,
    body: record.body,
    headers: record.headers,
    ip: record.ip,
  };
}

function sendRouteResponse(res: unknown, response: RouteResponse): void {
  const target = res as {
    status?: (code: number) => unknown;
    setHeader?: (name: string, value: string) => void;
    json?: (body: unknown) => void;
    send?: (body: unknown) => void;
  };

  target.status?.(response.status);
  for (const [key, value] of Object.entries(response.headers)) {
    target.setHeader?.(key, value);
  }

  if (typeof response.body === 'string') {
    target.send?.(response.body);
    return;
  }

  target.json?.(response.body);
}

export function mountAipDashboard(app: MountableApp, options: MountOptions): void {
  const basePath = normalizeBasePath(options.basePath);
  const router = createAipDashboardRouter(options.deps);

  app.post?.(`${basePath}/lookup/summary`, async (req, res) => {
    sendRouteResponse(res, await router.handle(toRouteRequest('POST', '/lookup/summary', req)));
  });

  app.post?.(`${basePath}/lookup/events`, async (req, res) => {
    sendRouteResponse(res, await router.handle(toRouteRequest('POST', '/lookup/events', req)));
  });

  app.post?.(`${basePath}/lookup/export`, async (req, res) => {
    sendRouteResponse(res, await router.handle(toRouteRequest('POST', '/lookup/export', req)));
  });

  app.get?.(`${basePath}/admin/session/health`, async (req, res) => {
    sendRouteResponse(res, await router.handle(toRouteRequest('GET', '/admin/session/health', req)));
  });

  app.post?.(`${basePath}/admin/login`, async (req, res) => {
    sendRouteResponse(res, await router.handle(toRouteRequest('POST', '/admin/login', req)));
  });

  app.post?.(`${basePath}/admin/logout`, async (req, res) => {
    sendRouteResponse(res, await router.handle(toRouteRequest('POST', '/admin/logout', req)));
  });

  app.get?.(`${basePath}/admin/low-balance`, async (req, res) => {
    sendRouteResponse(res, await router.handle(toRouteRequest('GET', '/admin/low-balance', req)));
  });
}
