"use client";

import Image from "next/image";
import { Environment, Float, RoundedBox, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group, Mesh } from "three";

function ApiCardMesh() {
  const group = useRef<Group>(null);
  const sweep = useRef<Mesh>(null);

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const time = clock.getElapsedTime();
    group.current.position.y = Math.sin(time * 1.05) * 0.1;
    group.current.rotation.x = pointer.y * 0.22 + Math.sin(time * 0.78) * 0.045 - 0.12;
    group.current.rotation.y = pointer.x * 0.24 + Math.sin(time * 0.62) * 0.05 - 0.18;
    if (sweep.current) {
      sweep.current.position.x = pointer.x * 1.2;
    }
  });

  return (
    <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.38}>
      <group ref={group} rotation={[-0.12, -0.18, 0.04]}>
        <RoundedBox args={[4.28, 2.73, 0.18]} radius={0.17} smoothness={10}>
          <meshPhysicalMaterial color="#10100f" metalness={0.86} roughness={0.22} clearcoat={0.65} clearcoatRoughness={0.18} />
        </RoundedBox>
        <RoundedBox args={[4.12, 2.56, 0.19]} radius={0.145} smoothness={10} position={[0, 0, 0.045]}>
          <meshPhysicalMaterial color="#D97757" metalness={0.85} roughness={0.25} clearcoat={0.6} clearcoatRoughness={0.2} />
        </RoundedBox>
        <mesh ref={sweep} position={[0.1, 0.08, 0.152]} rotation={[0, 0, -0.18]}>
          <planeGeometry args={[0.42, 3.15]} />
          <meshBasicMaterial color="#F5EFE6" transparent opacity={0.18} />
        </mesh>
        <Text position={[-1.76, 0.76, 0.18]} fontSize={0.18} color="#F5EFE6" anchorX="left">
          ClcoCloud
        </Text>
        <Text position={[-1.76, 0.18, 0.18]} fontSize={0.16} color="#1F1E1D" anchorX="left">
          sk-clco-•••• ••••
        </Text>
        <Text position={[-1.76, -0.78, 0.18]} fontSize={0.14} color="#F5EFE6" anchorX="left">
          BALANCE / $1000.0000
        </Text>
      </group>
    </Float>
  );
}

export default function FloatingApiCard() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), { threshold: 0.1 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="group relative h-[420px] w-full max-w-[460px] translate-y-[12%]" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral/30 blur-3xl transition duration-500 group-hover:blur-[48px]" />
      <div className="pointer-events-none absolute left-9 top-9 z-10">
        <Image src="/main-logo.png" alt="" width={54} height={54} className="object-contain" priority />
      </div>
      <Canvas frameloop={active ? "always" : "demand"} camera={{ position: [0, 0, 6.2], fov: 40 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
        <ambientLight intensity={1.2} />
        <pointLight position={[1.6, 1.4, 2.2]} color="#D97757" intensity={1.2} />
        <directionalLight position={[3, 3, 4]} intensity={2.2} />
        <ApiCardMesh />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}
