import type { ApiErrorBody } from './types';

export function joinPath(basePath: string, path: string): string {
  return `${basePath.replace(/\/+$/g, '')}/${path.replace(/^\/+/g, '')}`;
}

export async function postJson<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as T & ApiErrorBody;

  if (!response.ok) {
    throw new Error(json.error?.code ?? '');
  }

  return json;
}

