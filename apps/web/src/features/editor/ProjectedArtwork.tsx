import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
export function ProjectedArtwork({
  target,
  root,
  position,
  rotation,
  size,
  texture,
}: {
  target: THREE.Mesh;
  root: THREE.Group;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number];
  texture: THREE.Texture;
}) {
  const geometry = useMemo(() => {
    root.updateWorldMatrix(true, true);
    const transform = new THREE.Matrix4()
      .copy(root.matrixWorld)
      .invert()
      .multiply(target.matrixWorld);
    const source = target.geometry.clone().applyMatrix4(transform);
    const proxy = new THREE.Mesh(source, target.material);
    proxy.matrixWorld.identity();
    const decal = new DecalGeometry(
      proxy,
      new THREE.Vector3(...position),
      new THREE.Euler(...rotation),
      new THREE.Vector3(...size),
    );
    source.dispose();
    return decal;
  }, [target, root, position, rotation, size]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-4}
      />
    </mesh>
  );
}
