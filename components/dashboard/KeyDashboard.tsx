"use client";

import React, { useEffect, useState } from "react";
import { useKeyStatus } from "@/lib/keys/hooks";
import { formatUsd, formatDateTime, formatTimeAgo, formatNumber } from "@/lib/format";
import { Pause, AlertCircle, RefreshCw, Key, Database, Activity, Clock } from "lucide-react";

export function KeyDashboard({ apiKey }: { apiKey: string }) {
  const { data, error, isLoading, fetchedAt } = useKeyStatus(apiKey);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  if (error) {
    let errorMessage = "데이터를 불러오는 중 오류가 발생했습니다.";
    if (error.status === 401) errorMessage = "유효하지 않은 API 키입니다.";
    if (error.status === 402) errorMessage = "잔액이 부족합니다.";
    if (error.status === 429) errorMessage = "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";

    return (
      <div className="w-full bg-white/60 backdrop-blur-xl border border-red-200/60 rounded-[32px] p-12 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-neutral-800 mb-2">조회 실패</h3>
        <p className="text-sm text-neutral-500">{errorMessage}</p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="w-full bg-white/60 backdrop-blur-xl border border-neutral-200/60 rounded-[32px] p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
        <div className="animate-pulse space-y-8">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-40 bg-neutral-200/60 rounded-xl"></div>
            <div className="h-4 w-24 bg-neutral-200/60 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-neutral-100/60 rounded-[24px]"></div>
            <div className="h-32 bg-neutral-100/60 rounded-[24px]"></div>
            <div className="h-32 bg-neutral-100/60 rounded-[24px]"></div>
          </div>
          <div className="h-64 bg-neutral-100/60 rounded-[24px] mt-8"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full bg-white/60 backdrop-blur-xl border border-neutral-200/60 rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-8 border-b border-neutral-200/60 bg-gradient-to-b from-white/40 to-transparent">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-coral/10 rounded-2xl border border-coral/20">
            <Key className="w-6 h-6 text-coral" />
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">API KEY</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                data.status === "active" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-neutral-100 text-neutral-600 border border-neutral-200"
              }`}>
                {data.status}
              </span>
            </div>
            <div className="font-mono text-xl font-semibold tracking-tight text-neutral-900">
              {data.prefix}<span className="text-neutral-300">••••••••</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-2 text-xs font-medium bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-neutral-200/60 shadow-sm">
          {isPaused ? (
            <span className="flex items-center text-amber-500">
              <Pause className="w-3.5 h-3.5 mr-1.5" /> 일시정지
            </span>
          ) : (
            <span className="flex items-center text-neutral-500">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-coral" /> {formatTimeAgo(fetchedAt)} 갱신됨
            </span>
          )}
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[24px] border border-neutral-200/60 shadow-sm relative overflow-hidden group hover:border-coral/30 transition-colors">
            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Database className="w-32 h-32 text-coral" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500 block mb-2">잔액 (Balance)</span>
            <span className="text-4xl font-extrabold tracking-tight text-neutral-900 flex items-baseline relative z-10">
              <span className="text-2xl text-neutral-400 mr-1">$</span>
              {data.balanceUsd?.toFixed(4) || "0.0000"}
            </span>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[24px] border border-neutral-200/60 shadow-sm relative overflow-hidden group hover:border-coral/30 transition-colors">
            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Activity className="w-32 h-32 text-coral" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500 block mb-2">지출 한도 (Spend Cap)</span>
            <span className="text-4xl font-extrabold tracking-tight text-neutral-900 flex items-baseline relative z-10">
              {data.monthlySpendCapUsd === null ? (
                <span className="text-3xl text-neutral-500">무제한</span>
              ) : (
                <>
                  <span className="text-2xl text-neutral-400 mr-1">$</span>
                  {data.monthlySpendCapUsd.toFixed(2)}
                </>
              )}
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[24px] border border-neutral-200/60 shadow-sm relative overflow-hidden group hover:border-coral/30 transition-colors">
            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Clock className="w-32 h-32 text-coral" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500 block mb-2">RPM 한도</span>
            <span className="text-4xl font-extrabold tracking-tight text-neutral-900 relative z-10">
              {formatNumber(data.rateLimitRpm)}
              <span className="text-sm text-neutral-400 ml-2 uppercase tracking-wide font-medium">Req/Min</span>
            </span>
          </div>
        </div>

        {/* Allowed Models */}
        {data.allowedModels && data.allowedModels.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[24px] border border-neutral-200/60 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">허용된 모델 (Allowed Models)</h4>
            <div className="flex flex-wrap gap-2">
              {data.allowedModels.map((model) => (
                <span key={model} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs rounded-full border border-neutral-200 font-mono transition-colors hover:bg-neutral-200 hover:text-neutral-900 shadow-sm">
                  {model}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Requests Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-neutral-200/60 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-200/60 bg-gradient-to-b from-neutral-50/50 to-transparent">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">최근 요청 (Recent Requests)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-500 text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">시간</th>
                  <th className="px-6 py-4">모델</th>
                  <th className="px-6 py-4 text-right">토큰</th>
                  <th className="px-6 py-4 text-right">지연 시간</th>
                  <th className="px-6 py-4 text-right">비용</th>
                  <th className="px-6 py-4 text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {!data.recentRequests || data.recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 text-sm font-medium">
                      최근 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.recentRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-neutral-50/80 transition-colors group">
                      <td className="px-6 py-4 text-neutral-500 text-xs font-mono font-medium">
                        {formatDateTime(req.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-neutral-800">
                        <span className="px-2.5 py-1 bg-neutral-100 rounded-md border border-transparent group-hover:border-neutral-200 transition-colors">
                          {req.requestedModel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-neutral-600">
                        {formatNumber(req.totalTokens)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-neutral-600">
                        {req.latencyMs}ms
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-coral font-bold">
                        {formatUsd(req.costUsd)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                          req.statusCode >= 200 && req.statusCode < 300 
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}>
                          {req.statusCode}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}
