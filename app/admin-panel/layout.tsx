import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ADMIN_GATE_PATH } from "@/lib/admin/config";
import { getCurrentAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "관리자 콘솔",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true, "max-snippet": -1, "max-image-preview": "none", "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#1A1916",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const headerStore = headers();

  const reqLike = {
    headers: headerStore,
    cookies: {
      get(name: string) {
        const value = cookieStore.get(name)?.value;
        return value ? { name, value } : undefined;
      },
    },
  } as unknown as NextRequest;

  const session = await getCurrentAdminSession(reqLike);
  if (!session) redirect(ADMIN_GATE_PATH);

  return (
    <div className="min-h-screen bg-[#1A1916] text-cream antialiased">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <AdminTopbar
            email={session.admin_email}
            country={session.country}
            expiresAt={session.expires_at}
          />
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
