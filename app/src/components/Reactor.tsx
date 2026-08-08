"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, useTexture } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function EmberField() {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const count = 90;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.4 + Math.random() * 2.2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.4) * 2.4;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.08 + Math.random() * 0.2;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < speeds.length; i++) {
      arr[i * 3 + 1] += speeds[i] * dt;
      if (arr[i * 3 + 1] > 2.2) arr[i * 3 + 1] = -1.6;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FF6A00"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </points>
  );
}

function LogoCore() {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const texture = useTexture("/caldera-logo.png");

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = t * 0.12;
      group.current.rotation.x = Math.sin(t * 0.18) * 0.04;
      const breathe = 1 + Math.sin(t * 0.7) * 0.018;
      group.current.scale.setScalar(breathe);
    }
    if (glow.current) {
      const mat = glow.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.22 + Math.sin(t * 1.1) * 0.08;
    }
  });

  return (
    <group ref={group}>
      {/* Magma core behind logo */}
      <mesh position={[0, 0, -0.08]} scale={1.15}>
        <circleGeometry args={[1.05, 48]} />
        <meshBasicMaterial color="#D84A05" transparent opacity={0.35} />
      </mesh>
      <mesh ref={glow} position={[0, 0, -0.12]} scale={1.55}>
        <circleGeometry args={[1.05, 48]} />
        <meshBasicMaterial
          color="#FF6A00"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>

      {/* Logo plane — forged mark */}
      <mesh>
        <planeGeometry args={[2.35, 2.35]} />
        <meshStandardMaterial
          map={texture}
          transparent
          roughness={0.55}
          metalness={0.35}
          emissive="#FF6A00"
          emissiveIntensity={0.18}
          emissiveMap={texture}
        />
      </mesh>

      {/* Thin industrial rings */}
      {[1.28, 1.42, 1.58].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2, 0, i * 0.4]}>
          <torusGeometry args={[r, 0.008, 8, 96]} />
          <meshBasicMaterial
            color="#FF6A00"
            transparent
            opacity={0.18 - i * 0.04}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#070707"]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 2.2]} intensity={2.4} color="#FF6A00" distance={8} />
      <pointLight position={[-2, 1.5, 1]} intensity={0.6} color="#D84A05" />
      <pointLight position={[2, -1, 1.5]} intensity={0.35} color="#FF8A3D" />
      <Float speed={0.55} rotationIntensity={0.15} floatIntensity={0.35}>
        <Suspense fallback={null}>
          <LogoCore />
        </Suspense>
      </Float>
      <EmberField />
      <Sparkles
        count={40}
        scale={[5, 4, 5]}
        size={1.4}
        speed={0.15}
        opacity={0.35}
        color="#FF6A00"
      />
      {/* Basalt ground silhouette hint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.85, 0]}>
        <circleGeometry args={[3.2, 48]} />
        <meshBasicMaterial color="#0a0a0a" transparent opacity={0.85} />
      </mesh>
    </>
  );
}

export function Reactor() {
  return (
    <div className="relative h-full min-h-[48vh] w-full bg-void">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.15, 4.2], fov: 38 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Scene />
      </Canvas>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-void to-transparent"
      />
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.28em] text-mist">
        Core · Online
      </p>
    </div>
  );
}
