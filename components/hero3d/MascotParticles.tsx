"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, InstancedMesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
import { reducedMotionEnabled } from "@/lib/hero3d/animations";

type Particle = {
  direction: Vector3;
  speed: number;
  size: number;
};

const PARTICLE_COUNT = 10;

export function MascotParticles({ burstId }: { burstId: number }) {
  const meshRef = useRef<InstancedMesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const particles = useRef<Particle[]>([]);
  const startedAt = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!burstId || reducedMotionEnabled()) return;
    particles.current = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
      const angle = (Math.PI * 2 * index) / PARTICLE_COUNT + Math.random() * 0.28;
      return {
        direction: new Vector3(Math.cos(angle) * 0.74, Math.sin(angle) * 0.54 + 0.18, (Math.random() - 0.5) * 0.24).normalize(),
        speed: 0.42 + Math.random() * 0.46,
        size: 0.03 + Math.random() * 0.025
      };
    });
    startedAt.current = performance.now();
    setVisible(true);
  }, [burstId]);

  useFrame(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material || !visible) return;

    const elapsed = Math.min((performance.now() - startedAt.current) / 680, 1);
    const fade = 1 - elapsed;
    material.opacity = fade;

    particles.current.forEach((particle, index) => {
      const distance = particle.speed * elapsed;
      dummy.position.copy(particle.direction).multiplyScalar(distance);
      dummy.scale.setScalar(particle.size * (1 + elapsed * 1.3));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (elapsed >= 1) setVisible(false);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} visible={visible} position={[0.04, 0.02, 0.12]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial ref={materialRef} color={new Color("#D97757")} transparent opacity={0} depthWrite={false} />
    </instancedMesh>
  );
}
