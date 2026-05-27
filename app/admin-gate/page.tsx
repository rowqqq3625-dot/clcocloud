import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { isKoreaRequest } from "@/lib/admin/geo";
import { verifyAdminEntryToken } from "@/lib/admin/entry";
import { issueCsrfTokenOnCookieJar } from "@/lib/admin/csrf";
import { ADMIN_CSRF_COOKIE } from "@/lib/admin/config";
import { AdminGateForm } from "@/components/admin/AdminGateForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Opt-in geo gate. The admin entry token already proves the requester is a
// verified admin candidate via OAuth session. Geo enforcement here is
// secondary and opt-in via ADMIN_GEO_REQUIRED=true.
const GEO_REQUIRED = (process.env.ADMIN_GEO_REQUIRED || "").trim().toLowerCase() === "true";

function DenyView() {
  return (
    <main className="grid place-items-center text-center">
      <p className="text-sm text-cream/70">접근할 수 없습니다.</p>
    </main>
  );
}

export default async function AdminGatePage() {
  const cookieStore = cookies();
  const headerStore = headers();

  // Synthesize a minimal request-like object for the gate utilities.
  const reqLike = {
    headers: headerStore,
    cookies: {
      get(name: string) {
        const value = cookieStore.get(name)?.value;
        return value ? { name, value } : undefined;
      },
    },
  } as unknown as NextRequest;

  if (GEO_REQUIRED && !isKoreaRequest(headerStore)) return <DenyView />;

  const challenge = await verifyAdminEntryToken(reqLike);
  if (!challenge) return <DenyView />;

  let csrf = cookieStore.get(ADMIN_CSRF_COOKIE)?.value || null;
  if (!csrf) {
    try {
      csrf = issueCsrfTokenOnCookieJar(cookieStore);
    } catch {
      csrf = null;
    }
  }

  return <AdminGateForm initialStep={challenge.password_passed ? "date-code" : "password"} csrfToken={csrf} />;
}
