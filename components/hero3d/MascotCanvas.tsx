"use client";

import { ContactShadows, Environment, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { MascotModel } from "@/components/hero3d/MascotModel";
import { MascotParticles } from "@/components/hero3d/MascotParticles";
import { MascotToast } from "@/components/hero3d/MascotToast";
import { BrandLogo } from "@/components/ui/BrandLogo";
import type { MouseRef } from "@/lib/hero3d/use-mouse";

function MascotFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
      <div className="grid h-24 w-24 place-items-center rounded-[32px] border border-coral/20 bg-coral/10 shadow-coral backdrop-blur-md">
        <BrandLogo size={60} />
      </div>
      <span className="absolute h-3 w-3 animate-ping rounded-full bg-coral/60" />
    </div>
  );
}

function useMobileCanvas() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return mobile;
}

export default function MascotCanvas({
  scrollProgress,
  mouseRef,
  onMascotClick,
  toastMessage,
  burstId
}: {
  scrollProgress: number;
  mouseRef: React.MutableRefObject<MouseRef>;
  onMascotClick: () => void;
  toastMessage: string | null;
  burstId: number;
}) {
  const mobile = useMobileCanvas();
  const rootRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={rootRef}
      className="hero3d-canvas-shell relative h-full w-full"
      role="img"
      aria-label="클코클라우드 마스코트 인터랙티브 캐릭터"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onMascotClick();
      }}
    >
      <Suspense fallback={<MascotFallback />}>
        <Canvas
          dpr={mobile ? 1 : ([1, 1.5] as [number, number])}
          frameloop="always"
          gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
          shadows={false}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = mobile ? 1.05 : 1.15;
            gl.outputColorSpace = SRGBColorSpace;
          }}
        >
          <PerspectiveCamera makeDefault fov={mobile ? 38 : 32} position={[0, 0.2, mobile ? 6.5 : 5.5]} near={0.1} far={100} />
          <ambientLight intensity={mobile ? 0.52 : 0.6} color="#FFF5EB" />
          <directionalLight position={[3, 4, 5]} intensity={mobile ? 1.35 : 2.0} color="#FFF5EB" />
          <directionalLight position={[-4, 2, 3]} intensity={mobile ? 0.45 : 0.8} color="#E59478" />
          <directionalLight position={[0, -1, -3]} intensity={mobile ? 0.22 : 0.4} color="#D97757" />
          <Environment preset="city" environmentIntensity={mobile ? 0.8 : 1.2} />
          <MascotModel scrollProgress={scrollProgress} mouseRef={mouseRef} activationSignal={burstId} mobile={mobile} />
          <MascotParticles burstId={burstId} />
          <MascotToast message={toastMessage} />
          {!mobile ? <ContactShadows position={[0, -1.4, 0]} opacity={0.32} scale={6} blur={2.2} far={3} color="#1F1E1D" /> : null}
        </Canvas>
      </Suspense>
    </div>
  );
}
