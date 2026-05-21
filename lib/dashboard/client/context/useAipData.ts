'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fingerprintForCache } from './fingerprint';
import { joinPath, postJson } from './api';
import { useAipContext } from './AipContext';
import { usePageVisible } from './useVisibilityPolling';
import type { EventsBody, LoadState, RangeValue, SummaryBody } from './types';

function useFingerprint(apiKey: string): string {
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (apiKey === '') {
      setFingerprint('');
      return;
    }

    fingerprintForCache(apiKey).then((value) => {
      if (!cancelled) {
        setFingerprint(value);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return fingerprint;
}

function useAipRequest<T>(
  apiKey: string,
  range: RangeValue,
  page: number | undefined,
  kind: 'summary' | 'events',
  path: string
): LoadState<T> {
  const { basePath, queryClient } = useAipContext();
  const visible = usePageVisible();
  const fingerprint = useFingerprint(apiKey);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const backoffRef = useRef(30_000);
  const previousFpRef = useRef('');
  const inFlightRef = useRef<Promise<void> | null>(null);
  const lastManualRefetchAt = useRef(0);
  const dataRef = useRef<T | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (fingerprint === '') {
      return;
    }

    if (previousFpRef.current !== '' && previousFpRef.current !== fingerprint) {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === 'gudokpin' && query.queryKey[1] !== fingerprint,
      });
      setData(null);
      setUpdatedAt(null);
    }

    previousFpRef.current = fingerprint;
  }, [fingerprint, queryClient]);

  const refetch = useCallback(async () => {
    if (apiKey === '' || fingerprint === '') {
      return;
    }
    if (inFlightRef.current !== null) {
      return inFlightRef.current;
    }

    const queryKey = ['gudokpin', fingerprint, kind, range, page].filter((part) => part !== undefined);
    const cached = queryClient.get<T>(queryKey);
    if (cached !== null && dataRef.current === null) {
      setData(cached);
    }

    const request = (async () => {
      setLoading(dataRef.current === null && cached === null);
      setError('');
      const requestBody =
        kind === 'summary'
          ? { apiKey, range }
          : { apiKey, range, page: page ?? 1, pageSize: 10 };
      const next = await postJson<T>(joinPath(basePath, path), requestBody);
      queryClient.set(queryKey, next);
      setData(next);
      setUpdatedAt(new Date());
      backoffRef.current = 30_000;
    })();

    inFlightRef.current = request;

    try {
      await request;
    } catch (err: any) {
      setError(err?.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      backoffRef.current = 30_000;
    } finally {
      inFlightRef.current = null;
      setLoading(false);
    }
  }, [apiKey, basePath, fingerprint, kind, page, path, queryClient, range]);

  const manualRefetch = useCallback(async (force?: boolean) => {
    const now = Date.now();
    if (!force && now - lastManualRefetchAt.current < 3_000) {
      return;
    }
    lastManualRefetchAt.current = now;
    await refetch();
  }, [refetch]);

  useEffect(() => {
    if (apiKey === '' || fingerprint === '') {
      return;
    }

    let cancelled = false;
    void refetch();

    function schedule(): void {
      if (cancelled) {
        return;
      }

      window.setTimeout(() => {
        if (cancelled) {
          return;
        }
        if (document.visibilityState !== 'hidden') {
          void refetch();
        }
        schedule();
      }, backoffRef.current);
    }

    schedule();

    return () => {
      cancelled = true;
    };
  }, [apiKey, fingerprint, refetch, visible]);

  return { data, error, loading, updatedAt, refetch: manualRefetch };
}

export function useAipSummary(apiKey: string, range: RangeValue): LoadState<SummaryBody> {
  return useAipRequest<SummaryBody>(
    apiKey,
    range,
    undefined,
    'summary',
    '/lookup/summary'
  );
}

export function useAipEvents(apiKey: string, range: RangeValue, page = 1): LoadState<EventsBody> {
  return useAipRequest<EventsBody>(
    apiKey,
    range,
    page,
    'events',
    '/lookup/events'
  );
}
