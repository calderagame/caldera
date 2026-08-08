"use client";

import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { CameraControls, Html, Stars, useTexture } from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import {
  buildInnerWireGeometry,
  buildLandCentroids,
  buildLandFaces,
  buildLandMeshGeometry,
  buildWireGeometry,
} from "@/lib/geodesic";
import {
  CONTINENTS,
  LAND_COLORS,
  continentAccent,
  ownerColor,
} from "@/lib/lands";

const R = 2;
const PATCH_R = R * 1.018;
const EARTH =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg";
const EARTH_NORMAL =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_normal_2048.jpg";
const CLOUDS =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_clouds_1024.png";

export type LandVisualState = {
  owner?: string;
  highValue?: boolean;
  recent?: boolean;
};

function PlanetCore() {
  const cloudsRef = useRef<THREE.Mesh>(null);
  const [colorMap, normalMap, cloudsMap] = useTexture([
    EARTH,
    EARTH_NORMAL,
    CLOUDS,
  ]);

  useFrame((_, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.02;
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[R * 0.992, 96, 96]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          shininess={8}
          specular={new THREE.Color("#1a1a1a")}
        />
      </mesh>
      <mesh ref={cloudsRef} scale={1.004}>
        <sphereGeometry args={[R * 0.992, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.035}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshBasicMaterial
          color="#FF6A00"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function ContinentLabels({
  selected,
  hovered,
}: {
  selected: number | null;
  hovered: number | null;
}) {
  const centroids = useMemo(() => buildLandCentroids(PATCH_R * 1.08), []);

  return (
    <group>
      {CONTINENTS.map((c) => {
        const active = selected === c.id || hovered === c.id;
        const pos = centroids.get(c.id);
        if (!pos) return null;
        return (
          <Html
            key={c.id}
            position={[pos.x, pos.y, pos.z]}
            center
            distanceFactor={6.5}
            style={{ pointerEvents: "none", userSelect: "none" }}
            zIndexRange={[20, 0]}
          >
            <div
              className={[
                "flex flex-col items-center transition duration-200",
                active ? "scale-110 opacity-100" : "opacity-90",
              ].join(" ")}
            >
              <span
                className="border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em]"
                style={{
                  color: active ? "#070707" : "#F3F1EC",
                  background: active ? c.accent : "rgba(7,7,7,0.78)",
                  borderColor: c.accent,
                  boxShadow: active
                    ? `0 0 0 1px ${c.accent}`
                    : `0 0 12px rgba(0,0,0,0.45)`,
                }}
              >
                {c.code}
              </span>
              <span
                className="mt-1 text-[9px] uppercase tracking-[0.14em]"
                style={{
                  color: active ? c.accent : "rgba(236,233,226,0.75)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.85)",
                }}
              >
                {c.name}
              </span>
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function ContinentMarkers({
  selected,
  hovered,
}: {
  selected: number | null;
  hovered: number | null;
}) {
  const centroids = useMemo(() => buildLandCentroids(PATCH_R * 1.02), []);
  const pulse = useRef(0);

  useFrame((_, delta) => {
    pulse.current += delta;
  });

  return (
    <group>
      {CONTINENTS.map((c) => {
        const active = selected === c.id || hovered === c.id;
        const pos = centroids.get(c.id);
        if (!pos) return null;
        const s = active ? 0.055 + Math.sin(pulse.current * 4) * 0.008 : 0.038;
        return (
          <mesh key={c.id} position={pos}>
            <sphereGeometry args={[s, 16, 16]} />
            <meshBasicMaterial
              color={c.accent}
              transparent
              opacity={active ? 1 : 0.85}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function LandGrid({
  selected,
  hovered,
  onHover,
  onSelect,
  states,
}: {
  selected: number | null;
  hovered: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number, centroid: THREE.Vector3) => void;
  states: Record<number, LandVisualState>;
}) {
  const faces = useMemo(() => buildLandFaces(PATCH_R), []);
  const fillGeo = useMemo(() => buildLandMeshGeometry(faces), [faces]);
  const wireGeo = useMemo(() => buildWireGeometry(faces), [faces]);
  const innerWire = useMemo(() => buildInnerWireGeometry(PATCH_R), []);
  const meshRef = useRef<THREE.Mesh>(null);
  const pulse = useRef(0);

  useFrame((_, delta) => {
    pulse.current += delta;
    const mesh = meshRef.current;
    if (!mesh) return;
    const colorAttr = mesh.geometry.getAttribute(
      "color",
    ) as THREE.BufferAttribute;
    const idAttr = mesh.geometry.getAttribute("landId") as THREE.BufferAttribute;
    if (!colorAttr || !idAttr) return;

    const c = new THREE.Color();
    const foam = new THREE.Color(LAND_COLORS.type);
    const copper = new THREE.Color(LAND_COLORS.copper);

    for (let i = 0; i < idAttr.count; i++) {
      const id = idAttr.getX(i);
      const st = states[id];
      const owned =
        !!st?.owner && st.owner !== "0x0000000000000000000000000000000000000000";
      const accent = new THREE.Color(continentAccent(id));

      if (id === selected) {
        c.copy(accent).lerp(foam, 0.35);
      } else if (id === hovered) {
        c.copy(accent).lerp(foam, 0.18);
      } else if (owned) {
        c.copy(accent).lerp(new THREE.Color(ownerColor(st.owner)), 0.45);
      } else if (st?.recent) {
        const t = 0.5 + 0.5 * Math.sin(pulse.current * 3);
        c.copy(accent).lerp(copper, 0.2 * t);
      } else {
        c.copy(accent);
      }

      colorAttr.setXYZ(i, c.r, c.g, c.b);
    }
    colorAttr.needsUpdate = true;
  });

  const centroids = useMemo(() => {
    const map = new Map<number, THREE.Vector3>();
    for (const f of faces) {
      if (!map.has(f.id)) map.set(f.id, f.centroid.clone());
    }
    return map;
  }, [faces]);

  const pick = useCallback((e: ThreeEvent<PointerEvent | MouseEvent>) => {
    e.stopPropagation();
    const faceIndex = e.faceIndex;
    if (faceIndex == null || !meshRef.current) return;
    const idAttr = meshRef.current.geometry.getAttribute(
      "landId",
    ) as THREE.BufferAttribute;
    if (!idAttr) return;
    const id = idAttr.getX(faceIndex * 3);
    if (Number.isNaN(id)) return;
    return id;
  }, []);

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={fillGeo}
        onPointerMove={(e) => {
          const id = pick(e);
          if (id != null) onHover(id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          const id = pick(e);
          if (id == null) return;
          const centroid = centroids.get(id);
          if (!centroid) return;
          onSelect(id, centroid.clone());
        }}
        onDoubleClick={(e) => {
          const id = pick(e);
          if (id == null) return;
          const centroid = centroids.get(id);
          if (!centroid) return;
          onSelect(id, centroid.clone());
        }}
      >
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.78}
          roughness={0.55}
          metalness={0.28}
          depthWrite={false}
          side={THREE.DoubleSide}
          emissive={new THREE.Color("#1a1208")}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Outer rim — strong continent edge */}
      <lineSegments geometry={wireGeo} renderOrder={2}>
        <lineBasicMaterial
          color="#f0f0f0"
          transparent
          opacity={0.92}
          depthTest
        />
      </lineSegments>

      {/* Inner rim — accent depth */}
      <lineSegments geometry={innerWire} renderOrder={2}>
        <lineBasicMaterial
          color="#FF6A00"
          transparent
          opacity={0.75}
          depthTest
        />
      </lineSegments>
    </group>
  );
}

function Scene({
  selected,
  onSelectLand,
  states,
  focusRequest,
}: {
  selected: number | null;
  onSelectLand: (id: number) => void;
  states: Record<number, LandVisualState>;
  focusRequest: { id: number; nonce: number } | null;
}) {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focus, setFocus] = useState<THREE.Vector3 | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const interacting = useRef(false);
  const centroids = useMemo(() => buildLandCentroids(PATCH_R), []);

  useFrame((_, delta) => {
    if (groupRef.current && !interacting.current) {
      groupRef.current.rotation.y += delta * 0.008;
    }
  });

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !focus) return;
    const dir = focus.clone().normalize();
    const dist = Math.min(Math.max(controls.distance, 3.15), 4.1);
    const from = dir.multiplyScalar(dist);
    void controls.setLookAt(from.x, from.y, from.z, 0, 0, 0, true);
  }, [focus]);

  useEffect(() => {
    if (!focusRequest) return;
    const c = centroids.get(focusRequest.id);
    if (!c) return;
    setFocus(c.clone());
  }, [focusRequest, centroids]);

  return (
    <>
      <color attach="background" args={[LAND_COLORS.void]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[6, 3, 4]} intensity={1.35} color="#F3F1EC" />
      <directionalLight
        position={[-5, -1, -3]}
        intensity={0.45}
        color="#FF6A00"
      />
      <pointLight position={[0, 0, 4]} intensity={0.35} color="#D84A05" distance={12} />
      <Stars
        radius={90}
        depth={50}
        count={900}
        factor={2.2}
        saturation={0}
        fade
        speed={0.18}
      />

      <CameraControls
        ref={controlsRef}
        makeDefault
        dollySpeed={0.55}
        polarRotateSpeed={0.55}
        azimuthRotateSpeed={0.55}
        minDistance={2.85}
        maxDistance={7.2}
        smoothTime={0.4}
        onStart={() => {
          interacting.current = true;
        }}
        onEnd={() => {
          interacting.current = false;
        }}
      />

      <Suspense fallback={null}>
        <group ref={groupRef}>
          <PlanetCore />
          <LandGrid
            selected={selected}
            hovered={hovered}
            states={states}
            onHover={(id) => {
              document.body.style.cursor = id == null ? "default" : "pointer";
              setHovered(id);
            }}
            onSelect={(id, centroid) => {
              setFocus(centroid.clone());
              onSelectLand(id);
            }}
          />
          <ContinentMarkers selected={selected} hovered={hovered} />
          <ContinentLabels selected={selected} hovered={hovered} />
        </group>
      </Suspense>
    </>
  );
}

export function Globe({
  selected,
  onSelect,
  states = {},
  focusRequest = null,
}: {
  selected: number | null;
  onSelect: (id: number) => void;
  states?: Record<number, LandVisualState>;
  focusRequest?: { id: number; nonce: number } | null;
}) {
  return (
    <div className="relative h-full min-h-[48vh] w-full lg:min-h-0">
      <Canvas
        camera={{ position: [0, 0.15, 5.6], fov: 36 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        className="!absolute inset-0"
        onPointerMissed={() => {
          document.body.style.cursor = "default";
        }}
      >
        <Scene
          selected={selected}
          onSelectLand={onSelect}
          states={states}
          focusRequest={focusRequest}
        />
      </Canvas>

      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist/80">
        Drag to orbit · Scroll to zoom · Click a territory to seize
      </p>
    </div>
  );
}
