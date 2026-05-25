"use client";

import { useEffect, useRef } from "react";
import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";

export function VideoDashboard() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Attempt to play the video programmatically on load to ensure autoplay starts
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay was prevented by browser policies. Retrying on user interaction.", err);
      });
    }
  }, []);

  return (
    <section className="relative overflow-hidden bg-[var(--surface-dark)] py-10 md:py-20 text-[var(--cream)]">
      {/* Premium Backlighting Glow (Apple-style Atmosphere Light) */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] md:h-[800px] md:w-[800px] rounded-full bg-[radial-gradient(circle,rgba(217,119,87,0.16)_0%,rgba(217,119,87,0.04)_50%,transparent_70%)] blur-[80px]" />
      </div>

      {/* Decorative Grid Mesh in the Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(247,241,232,0.03)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] opacity-70" />

      {/* Cinematic wide container (max-w-[1440px]) to make the video size larger */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-16">
        <CCAnimatedContent distance={30} duration={0.8}>
          {/* Apple-style Premium Video Container - select-none and pointer-events-none to prevent browser hover overlays */}
          <div className="group relative mx-auto select-none pointer-events-none overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0a0a]/85 p-1 md:rounded-[28px] md:border-white/[0.08] lg:rounded-[36px] shadow-[0_0_1px_rgba(255,255,255,0.1)_inset,0_32px_80px_rgba(0,0,0,0.7),0_0_60px_rgba(217,119,87,0.06)] transition-all duration-700 hover:border-white/[0.12] hover:shadow-[0_32px_90px_rgba(0,0,0,0.85),0_0_80px_rgba(217,119,87,0.1)]">
            
            {/* Elegant Inner Glass Outline */}
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/[0.05] z-10" />

            {/* Video Frame wrapper to force rounded corners */}
            <div className="relative overflow-hidden rounded-[12px] md:rounded-[24px] lg:rounded-[32px] bg-black/90">
              <video
                ref={videoRef}
                src="/videos/fcc6f7fcb17b434e9c89570ee009ad8a.mp4"
                className="w-full h-auto block object-cover scale-[1.002] transition-transform duration-500 pointer-events-none"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                controls={false}
                disablePictureInPicture
                disableRemotePlayback
                controlsList="nodownload nofullscreen noremoteplayback"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </CCAnimatedContent>
      </div>
    </section>
  );
}
