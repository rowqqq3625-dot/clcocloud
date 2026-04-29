import useSWR from "swr";
import { ApiKeyStatus } from "./types";

const fetcher = async (url: string, apiKey: string) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || "An error occurred while fetching the data.");
    (error as any).status = res.status;
    throw error;
  }

  return res.json() as Promise<{ data: ApiKeyStatus; fetchedAt: string }>;
};

export function useKeyStatus(apiKey: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    apiKey ? ["/api/key-status", apiKey] : null,
    ([url, key]) => fetcher(url, key),
    {
      refreshInterval: 0,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      keepPreviousData: true,
    }
  );

  return {
    data: data?.data,
    fetchedAt: data?.fetchedAt,
    error,
    isLoading,
    mutate,
  };
}
