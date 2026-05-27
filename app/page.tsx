import { HomeStructuredData } from "@/components/seo/HomeStructuredData";
import { Sequence01Hero } from "@/components/sequences/Sequence01Hero";
import { Sequence02TrustStrip } from "@/components/sequences/Sequence02TrustStrip";
import { Sequence03Dashboard } from "@/components/sequences/Sequence03Dashboard";
import BundleSection from "@/components/bundle/BundleSection";
import { Sequence04Compare } from "@/components/sequences/Sequence04Compare";
import { Sequence05Simulator } from "@/components/sequences/Sequence05Simulator";
import { Sequence06Pricing } from "@/components/sequences/Sequence06Pricing";
import { Sequence07PhotoBreak } from "@/components/sequences/Sequence07PhotoBreak";
import { Sequence08Flow } from "@/components/sequences/Sequence08Flow";
import { Sequence09IndependentKey } from "@/components/sequences/Sequence09IndependentKey";
import { Sequence10TextureBreak } from "@/components/sequences/Sequence10TextureBreak";
import { Sequence11FAQ } from "@/components/sequences/Sequence11FAQ";
import { Sequence12FinalCTA } from "@/components/sequences/Sequence12FinalCTA";
import { Sequence13Footer } from "@/components/sequences/Sequence13Footer";

export default function Page() {
  return (
    <main data-nosnippet>
      <HomeStructuredData />
      <Sequence01Hero />
      <Sequence02TrustStrip />
      <Sequence03Dashboard />
      {/* <BundleSection /> 출시 준비 중 — 임시 숨김 */}
      <Sequence04Compare />
      <Sequence05Simulator />
      <Sequence06Pricing />
      <Sequence07PhotoBreak />
      <Sequence08Flow />
      <Sequence09IndependentKey />
      <Sequence10TextureBreak />
      <Sequence11FAQ />
      <Sequence12FinalCTA />
      <Sequence13Footer />
    </main>
  );
}
