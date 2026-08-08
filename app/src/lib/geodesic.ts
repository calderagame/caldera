import * as THREE from "three";
import { CONTINENTS, LAND_COUNT } from "./lands";

export type LandFace = {
  id: number;
  a: THREE.Vector3;
  b: THREE.Vector3;
  c: THREE.Vector3;
  centroid: THREE.Vector3;
};

/** lat/lon → sphere position (matches common Three.js earth texture orientation). */
export function latLonToVec3(lat: number, lon: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function orthonormalBasis(normal: THREE.Vector3) {
  const n = normal.clone().normalize();
  const up = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(up, n).normalize();
  const v = new THREE.Vector3().crossVectors(n, u).normalize();
  return { u, v, n };
}

/**
 * Build one land patch per continent: a geodesic cap of triangles on the sphere.
 * Returns 7 logical lands; each land may span many triangles (same id).
 */
export function buildLandFaces(radius: number): LandFace[] {
  const faces: LandFace[] = [];
  const segments = 18;

  for (const c of CONTINENTS) {
    const center = latLonToVec3(c.lat, c.lon, 1).normalize();
    const { u, v } = orthonormalBasis(center);
    const ang = (c.radiusDeg * Math.PI) / 180;
    const centroid = center.clone().multiplyScalar(radius);

    const ring: THREE.Vector3[] = [];
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const dir = center
        .clone()
        .multiplyScalar(Math.cos(ang))
        .add(u.clone().multiplyScalar(Math.sin(ang) * Math.cos(t)))
        .add(v.clone().multiplyScalar(Math.sin(ang) * Math.sin(t)))
        .normalize();
      ring.push(dir.multiplyScalar(radius));
    }

    for (let i = 0; i < segments; i++) {
      const a = centroid.clone();
      const b = ring[i];
      const cVert = ring[(i + 1) % segments];
      faces.push({
        id: c.id,
        a,
        b: b.clone(),
        c: cVert.clone(),
        centroid: centroid.clone(),
      });
    }
  }

  if (CONTINENTS.length !== LAND_COUNT) {
    console.warn(
      `[caldera] continent count ${CONTINENTS.length} != LAND_COUNT ${LAND_COUNT}`,
    );
  }

  return faces;
}

/** Centroid keyed by land id (1..7) for camera focus. */
export function buildLandCentroids(radius: number): Map<number, THREE.Vector3> {
  const map = new Map<number, THREE.Vector3>();
  for (const c of CONTINENTS) {
    map.set(c.id, latLonToVec3(c.lat, c.lon, radius));
  }
  return map;
}

export function buildLandMeshGeometry(faces: LandFace[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const landIds: number[] = [];

  const base = new THREE.Color("#17201D");

  for (const f of faces) {
    positions.push(f.a.x, f.a.y, f.a.z, f.b.x, f.b.y, f.b.z, f.c.x, f.c.y, f.c.z);
    for (let i = 0; i < 3; i++) {
      colors.push(base.r, base.g, base.b);
      landIds.push(f.id);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("landId", new THREE.Float32BufferAttribute(landIds, 1));
  geo.computeVertexNormals();
  return geo;
}

export function buildWireGeometry(faces: LandFace[]): THREE.BufferGeometry {
  // Only draw outer ring edges (skip spokes to centroid) for cleaner continent outlines.
  const positions: number[] = [];
  const byLand = new Map<number, LandFace[]>();
  for (const f of faces) {
    const list = byLand.get(f.id) ?? [];
    list.push(f);
    byLand.set(f.id, list);
  }

  for (const list of byLand.values()) {
    for (const f of list) {
      positions.push(f.b.x, f.b.y, f.b.z, f.c.x, f.c.y, f.c.z);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

/** Slightly inset ring for a double-border look. */
export function buildInnerWireGeometry(
  radius: number,
  insetDeg = 2.2,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const segments = 48;

  for (const c of CONTINENTS) {
    const center = latLonToVec3(c.lat, c.lon, 1).normalize();
    const up =
      Math.abs(center.y) < 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(up, center).normalize();
    const v = new THREE.Vector3().crossVectors(center, u).normalize();
    const ang = ((c.radiusDeg - insetDeg) * Math.PI) / 180;
    const ring: THREE.Vector3[] = [];
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const dir = center
        .clone()
        .multiplyScalar(Math.cos(ang))
        .add(u.clone().multiplyScalar(Math.sin(ang) * Math.cos(t)))
        .add(v.clone().multiplyScalar(Math.sin(ang) * Math.sin(t)))
        .normalize()
        .multiplyScalar(radius * 1.004);
      ring.push(dir);
    }
    for (let i = 0; i < segments; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % segments];
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}
