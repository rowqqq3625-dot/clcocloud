import "server-only";
import { cookies } from "next/headers";
import { getSessionFromCookies } from "@/lib/auth-session";
import { isAdminCandidateEmail } from "@/lib/admin/config";
import { SiteHeader, type SessionUser } from "@/components/navigation/SiteHeader";

type SiteHeaderShellProps = {
  variant?: "floating" | "solid";
};

/**
 * Reads the session cookie at request time and renders SiteHeader with
 * pre-hydrated user data. This eliminates the brief "logged-out flash"
 * that occurs when SiteHeader fetches /api/session on the client after
 * mount. Use this wrapper anywhere SiteHeader is rendered from a server
 * component (pages and layouts). Client-only callers (e.g. Hero3D) must
 * forward initialUser/initialAdminCandidate manually via props.
 */
export function SiteHeaderShell({ variant = "floating" }: SiteHeaderShellProps) {
  const session = getSessionFromCookies(cookies());

  const initialUser: SessionUser | null = session
    ? {
        provider: session.provider,
        email: session.email || null,
        name: session.name || null,
        image: session.image || null,
      }
    : null;

  const initialAdminCandidate = Boolean(session?.email && isAdminCandidateEmail(session.email));

  return (
    <SiteHeader
      variant={variant}
      initialUser={initialUser}
      initialAdminCandidate={initialAdminCandidate}
    />
  );
}
