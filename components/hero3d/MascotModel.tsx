"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box3, Group, MathUtils, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { lerp, playMascotJump, reducedMotionEnabled } from "@/lib/hero3d/animations";
import type { MouseRef } from "@/lib/hero3d/use-mouse";

type MascotModelProps = {
  scrollProgress: number;
  mouseRef: React.MutableRefObject<MouseRef>;
  activationSignal: number;
  mobile?: boolean;
};

const MODEL_PATH = "/models/clcocloud-mascot.optimized.glb";
const FRONT_ROTATION_Y = 0;

function tuneMaterial(material: MeshStandardMaterial) {
  material.envMapIntensity = 1.2;
  material.needsUpdate = true;

  const color = material.color;
  const isCoral = color.r > 0.45 && color.g < 0.48 && color.b < 0.38;
  if (isCoral) {
    material.metalness = 0.1;
    material.roughness = 0.6;
    material.emissive.copy(color).multiplyScalar(0.08);
    material.emissiveIntensity = 0.1;
    return;
  }

  material.metalness = 0;
  material.roughness = 0.85;
  material.emissive.copy(color).multiplyScalar(0.035);
  material.emissiveIntensity = 0.08;
}

export function MascotModel({ scrollProgress, mouseRef, activationSignal, mobile = false }: MascotModelProps) {
  const groupRef = useRef<Group>(null);
  const modelRef = useRef<Group>(null);
  const look = useRef({ x: 0, y: 0, scroll: 0 });
  const squash = useRef({ value: 0 });
  const [hovered, setHovered] = useState(false);
  const gltf = useGLTF(MODEL_PATH, true);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const reducedMotion = useMemo(() => reducedMotionEnabled(), []);

  useEffect(() => {
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    scene.position.sub(center);

    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    scene.scale.setScalar((mobile ? 1.54 : 2.04) / maxAxis);
    scene.position.y += mobile ? 0.02 : 0.08;
    scene.rotation.set(0, FRONT_ROTATION_Y, 0);

    scene.traverse((object: Object3D) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (material instanceof MeshStandardMaterial) tuneMaterial(material);
      });
    });
  }, [mobile, scene]);

  useEffect(() => {
    if (!activationSignal || reducedMotion) return;
    playMascotJump(groupRef);
    gsap.fromTo(squash.current, { value: 0.22 }, { value: 0, duration: 0.62, ease: "elastic.out(1.15, 0.38)" });
  }, [activationSignal, reducedMotion]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    const model = modelRef.current;
    if (!group || !model) return;

    const time = clock.elapsedTime;
    const progress = MathUtils.clamp(scrollProgress, 0, 1);
    look.current.scroll = lerp(look.current.scroll, progress, 0.08);

    const mouseX = mobile || reducedMotion ? 0 : mouseRef.current.x;
    const mouseY = mobile || reducedMotion ? 0 : mouseRef.current.y;
    look.current.y = lerp(look.current.y, mouseX * 0.68, 0.14);
    look.current.x = lerp(look.current.x, -mouseY * 0.34, 0.14);

    const baseScale = MathUtils.lerp(mobile ? 0.84 : 1.1, mobile ? 0.74 : 0.94, look.current.scroll);
    const hoverScale = hovered && !reducedMotion ? 1.095 : 1;
    const breathe = reducedMotion ? 0 : Math.sin(time * 1.55) * 0.026;
    const aliveTilt = reducedMotion ? 0 : Math.sin(time * 1.05) * 0.038;
    const aliveSway = reducedMotion ? 0 : Math.sin(time * 0.82) * 0.04;
    const attentionLift = hovered && !reducedMotion ? 0.055 : 0;

    const finalScale = baseScale * hoverScale + breathe;
    group.scale.set(finalScale * (1 + squash.current.value * 0.45), finalScale * (1 - squash.current.value * 0.28), finalScale * (1 + squash.current.value * 0.22));
    group.position.y = -0.04 + attentionLift + (reducedMotion ? 0 : Math.sin(time * 1.35) * 0.072) - look.current.scroll * 0.24 + (mobile ? 0 : mouseY * 0.035);
    group.position.x = mobile ? 0 : 0.04 + look.current.scroll * 0.16 + aliveSway + mouseX * 0.075;
    group.rotation.y = FRONT_ROTATION_Y + look.current.y + look.current.scroll * 0.26 + aliveSway * 0.42;
    group.rotation.x = look.current.x + aliveTilt * 0.72;
    group.rotation.z = aliveTilt + (mobile || reducedMotion ? 0 : -mouseX * 0.035);

    model.position.y = reducedMotion ? 0 : Math.sin(time * 1.9 + 0.5) * 0.032;
    model.rotation.z = reducedMotion ? 0 : Math.sin(time * 1.25) * 0.012;
  });

  return (
    <group
      ref={groupRef}
      position={[0, -0.04, 0]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_PATH, true);
