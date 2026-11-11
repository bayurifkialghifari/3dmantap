import * as THREE from 'three';

export function printTargetGeometry(
  geometry: THREE.BufferGeometry,
  transform: THREE.Matrix4,
  rotation: [number, number, number],
) {
  const source = geometry.clone();
  // Integer attributes must be decoded before applying transforms to quantized GLBs.
  for (const name of ['position', 'normal']) {
    const attribute = source.getAttribute(name);
    if (!attribute) continue;
    const array = new Float32Array(attribute.count * 3);
    for (let index = 0; index < attribute.count; index++)
      array.set([attribute.getX(index), attribute.getY(index), attribute.getZ(index)], index * 3);
    source.setAttribute(name, new THREE.BufferAttribute(array, 3));
  }
  source.applyMatrix4(transform);
  const positions = source.getAttribute('position'),
    index = source.getIndex();
  const direction = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...rotation));
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    edge = new THREE.Vector3();
  const faces: number[] = [];
  for (let i = 0; i < (index?.count ?? positions.count); i += 3) {
    const ids = [0, 1, 2].map((n) => (index ? index.getX(i + n) : i + n));
    a.fromBufferAttribute(positions, ids[0]);
    b.fromBufferAttribute(positions, ids[1]);
    c.fromBufferAttribute(positions, ids[2]);
    normal.subVectors(b, a).cross(edge.subVectors(c, a)).normalize();
    // Reject backs and grazing faces: a front print must not stretch across a hat brim.
    if (normal.dot(direction) > 0.65) faces.push(...ids);
  }
  source.setIndex(faces);
  return source;
}
