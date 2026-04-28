import { ImageReveal } from "@/components/ui/ImageReveal";

export function Sequence10TextureBreak() {
  return (
    <section className="relative h-[60vh] overflow-hidden bg-cream-2">
      <ImageReveal
        src="/images/beige-macro.avif"
        alt="따뜻한 자연광이 닿은 베이지 종이와 직물의 추상 매크로 텍스처"
        fill
        sizes="100vw"
        imageClassName="animate-image-drift object-cover saturate-[1.05] hue-rotate-[-2deg]"
      />
      <div className="absolute inset-0 bg-coral/10" />
    </section>
  );
}
