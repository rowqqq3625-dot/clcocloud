import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { getSessionFromCookies } from "@/lib/auth-session";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getSessionFromCookies(cookies());
  if (!session) redirect(`/start?returnTo=${encodeURIComponent("/dashboard")}`);

  return (
    <div className="min-h-screen bg-cream text-primary">
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-cream/95 backdrop-blur-xl">
        <SiteHeader variant="solid" />
      </header>
      {children}
    </div>
  );
}
