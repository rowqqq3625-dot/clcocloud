import { Hero3D } from "@/components/sections/Hero3D";
import type { SessionUser } from "@/components/navigation/SiteHeader";

type Sequence01HeroProps = {
  initialUser?: SessionUser | null;
  initialAdminCandidate?: boolean;
};

export function Sequence01Hero({ initialUser = null, initialAdminCandidate = false }: Sequence01HeroProps) {
  return <Hero3D initialUser={initialUser} initialAdminCandidate={initialAdminCandidate} />;
}
