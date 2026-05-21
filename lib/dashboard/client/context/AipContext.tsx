'use client';

import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { AipQueryClient } from './queryClient';

interface AipContextValue {
  basePath: string;
  queryClient: AipQueryClient;
}

const AipContext = createContext<AipContextValue | null>(null);

export function AipProvider({ basePath, children }: { basePath: string; children: ReactNode }) {
  const queryClient = useMemo(() => new AipQueryClient(), []);
  const value = useMemo(() => ({ basePath, queryClient }), [basePath, queryClient]);

  return <AipContext.Provider value={value}>{children}</AipContext.Provider>;
}

export function useAipContext(): AipContextValue {
  const value = useContext(AipContext);
  if (value === null) {
    throw new Error('useAipContext must be used inside AipProvider');
  }

  return value;
}
