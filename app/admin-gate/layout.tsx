import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Access",
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

export const dynamic = "force-dynamic";

export default function AdminGateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1A1916] text-cream antialiased">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}
