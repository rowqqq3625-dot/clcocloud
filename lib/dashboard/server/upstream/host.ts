import 'server-only';

export const ROUTEAI_BROWSER_HOST = 'https://api.routeai.cc';
export const ROUTEAI_DASHBOARD_API_BASE = 'https://api.routeai.cc/api/v1';
export const ROUTEAI_DIRECT_API_BASE = 'https://api.routeai.cc/v1';
export const ROUTEAI_USAGE_PATH = '/usage';
export const ROUTEAI_DIRECT_USAGE_ENDPOINTS = [
  'https://hk.routeai.cc/v1/usage',
  'https://api.routeai.cc/v1/usage',
  'https://api.routeai.cc/api/v1/usage',
  'https://hk.routeai.cc/api/v1/usage',
  'https://routeai.cc/v1/usage',
  'https://routeai.cc/api/v1/usage',
  'https://routeai.cc/usage',
] as const;

