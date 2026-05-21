export type AipQueryKey = readonly unknown[];

interface QueryRecord<T> {
  queryKey: AipQueryKey;
  data: T;
  updatedAt: number;
}

export class AipQueryClient {
  private readonly records = new Map<string, QueryRecord<unknown>>();

  get<T>(queryKey: AipQueryKey): T | null {
    return (this.records.get(this.key(queryKey))?.data as T | undefined) ?? null;
  }

  set<T>(queryKey: AipQueryKey, data: T): void {
    this.records.set(this.key(queryKey), {
      queryKey,
      data,
      updatedAt: Date.now(),
    });
  }

  removeQueries(options: { predicate: (query: { queryKey: AipQueryKey }) => boolean }): void {
    for (const [cacheKey, record] of Array.from(this.records.entries())) {
      if (options.predicate({ queryKey: record.queryKey })) {
        this.records.delete(cacheKey);
      }
    }
  }

  clear(): void {
    this.records.clear();
  }

  private key(queryKey: AipQueryKey): string {
    return JSON.stringify(queryKey);
  }
}
