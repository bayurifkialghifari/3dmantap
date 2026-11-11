import * as THREE from 'three';
import {
  deformAvatarPoint,
  jointBones,
  setJoint,
  presetPose,
  type AvatarRenderRecipe,
  type AvatarJoint,
  type AvatarPose,
} from '@3dmantap/shared';
const armBone = (name: string) =>
  /^(upperarm|lowerarm|hand|index|middle|pinky|ring|thumb)/.test(name);
export type FittedAvatar = ReturnType<typeof fitAvatar>;
export function fitAvatar(
  scenes: THREE.Object3D[],
  recipe: AvatarRenderRecipe,
  colors: (string | undefined)[],
  longSleeves = false,
) {
  const group = new THREE.Group();
  scenes.forEach((s) => s.updateMatrixWorld(true));
  let source: THREE.Skeleton | undefined;
  scenes[0].traverse((o) => {
    if (o instanceof THREE.SkinnedMesh) source ??= o.skeleton;
  });
  if (!source) throw new Error('Rig manusia tidak tersedia.');
  const originals = source.bones,
    bones = originals.map((b) => {
      const copy = new THREE.Bone();
      copy.name = b.name;
      return copy;
    });
  const matrices = originals.map((b) => {
    const p = recipe.anchors[b.name];
    const fitted = deformAvatarPoint(
      p ?? [0, 0, 0],
      recipe,
      armBone(b.name) ? 1 : b.name.startsWith('clavicle') ? 0.5 : 0,
      b.name.endsWith('_r') ? 'r' : 'l',
    );
    return new THREE.Matrix4().compose(
      new THREE.Vector3(...fitted),
      b.getWorldQuaternion(new THREE.Quaternion()),
      new THREE.Vector3(1, 1, 1),
    );
  });
  originals.forEach((b, i) => {
    const parent = originals.indexOf(b.parent as THREE.Bone),
      local = matrices[i].clone();
    if (parent >= 0) {
      bones[parent].add(bones[i]);
      local.premultiply(matrices[parent].clone().invert());
    } else group.add(bones[i]);
    local.decompose(bones[i].position, bones[i].quaternion, bones[i].scale);
  });
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  skeleton.calculateInverses();
  const meshes: THREE.SkinnedMesh[] = [];
  const sources: THREE.Mesh[] = [];
  scenes.forEach((scene, si) =>
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const geometry = child.geometry.clone(),
        pos = geometry.getAttribute('position');
      const ids = geometry.getAttribute('skinIndex'),
        weights = geometry.getAttribute('skinWeight');
      const positions = new Float32Array(pos.count * 3),
        point = new THREE.Vector3(),
        delta = new THREE.Vector3();
      const names = child instanceof THREE.SkinnedMesh ? (child.morphTargetDictionary ?? {}) : {};
      const morphs = geometry.morphAttributes.position ?? [];
      const rotation = new THREE.Matrix3().setFromMatrix4(child.matrixWorld);
      const covered = new Uint8Array(pos.count);
      for (let i = 0; i < pos.count; i++) {
        point.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
        for (const [name, w] of Object.entries(recipe.morphs)) {
          const a = morphs[names[name]];
          if (a && w)
            point.add(delta.fromBufferAttribute(a, i).applyMatrix3(rotation).multiplyScalar(w));
        }
        let aw = 0;
        let torso = 0,
          legs = 0,
          upper = 0,
          lower = 0;
        if (ids && weights)
          for (let k = 0; k < 4; k++) {
            const name = originals[ids.getComponent(i, k)]?.name ?? '',
              w = weights.getComponent(i, k);
            if (armBone(name)) aw += w;
            if (/^(spine|pelvis)/.test(name)) torso += w;
            if (/^(thigh|calf)/.test(name)) legs += w;
            if (name.startsWith('upperarm')) upper += w;
            if (name.startsWith('lowerarm')) lower += w;
          }
        if (si === 0 && /^(Body|base)(?:_\d+)?$/.test(child.name)) {
          const side = point.x >= 0 ? 'l' : 'r',
            shoulder = new THREE.Vector3(...recipe.anchors['upperarm_' + side]),
            elbow = new THREE.Vector3(...recipe.anchors['lowerarm_' + side]);
          const direction = elbow.sub(shoulder),
            fraction = point.clone().sub(shoulder).dot(direction) / direction.lengthSq();
          covered[i] = Number(
            (torso > 0.6 && point.y < recipe.anchors.neck_01[1] - 0.025) ||
              legs > 0.7 ||
              (upper > 0.65 && (longSleeves || fraction < 0.33)) ||
              (longSleeves && lower > 0.7),
          );
        }
        positions.set(
          deformAvatarPoint([point.x, point.y, point.z], recipe, Math.min(1, aw)),
          i * 3,
        );
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      if (si === 0 && /^(Body|base)(?:_\d+)?$/.test(child.name) && geometry.index) {
        const index = geometry.index,
          kept: number[] = [];
        for (let i = 0; i < index.count; i += 3) {
          const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
          if (!ids.every((v) => covered[v])) kept.push(...ids);
        }
        geometry.setIndex(kept);
      }
      geometry.morphAttributes = {};
      geometry.deleteAttribute('normal');
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const material = (m: THREE.Material) => {
        const copy = m.clone();
        if (copy instanceof THREE.MeshStandardMaterial && colors[si]) {
          copy.color.set(colors[si]!);
          copy.roughness = Math.max(copy.roughness, 0.8);
          copy.normalScale.multiplyScalar(0.25);
        }
        return copy;
      };
      const mesh = new THREE.SkinnedMesh(
        geometry,
        Array.isArray(child.material) ? child.material.map(material) : material(child.material),
      );
      mesh.name = child.name;
      mesh.castShadow = true;
      mesh.frustumCulled = false;
      group.add(mesh);
      mesh.bind(skeleton, new THREE.Matrix4());
      meshes.push(mesh);
      sources.push(child);
    }),
  );
  const rest = Object.fromEntries(bones.map((b) => [b.name, b.quaternion.clone()]));
  const localBounds = () => {
    const box = new THREE.Box3(),
      point = new THREE.Vector3(),
      inverse = group.matrixWorld.clone().invert();
    for (const mesh of meshes)
      for (let i = 0; i < mesh.geometry.getAttribute('position').count; i++) {
        mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);
        box.expandByPoint(point);
      }
    return box;
  };
  const pose = (value: AvatarPose) => {
    group.position.y = 0;
    bones.forEach((b) => b.quaternion.copy(rest[b.name]));
    for (const [joint, angles] of Object.entries(value.joints)) {
      const key = joint as AvatarJoint,
        bone = bones.find((b) => b.name === jointBones[key]);
      if (!bone || !angles) continue;
      const clamped = setJoint(value, key, angles).joints[key]!;
      bone.quaternion.multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(...(clamped.map((v) => (v * Math.PI) / 180) as [number, number, number])),
        ),
      );
    }
    group.updateMatrixWorld(true);
    skeleton.update();
    const bounds = localBounds();
    group.position.y = -bounds.min.y;
    group.updateMatrixWorld(true);
    skeleton.update();
    return bounds.translate(new THREE.Vector3(0, -bounds.min.y, 0));
  };
  // Calibrate stature once in standing reference, before applying the user's pose.
  const standing = pose(presetPose('standing'));
  const correction = recipe.stature / standing.getSize(new THREE.Vector3()).y;
  group.position.y = 0;
  bones.forEach((b) => {
    b.quaternion.copy(rest[b.name]);
    b.position.multiplyScalar(correction);
  });
  meshes.forEach((m) => {
    m.geometry.scale(correction, correction, correction);
  });
  group.updateMatrixWorld(true);
  skeleton.calculateInverses();
  const dispose = () => {
    meshes.forEach((m) => {
      m.geometry.dispose();
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
    });
    skeleton.dispose();
  };
  return { group, bones, rest, skeleton, meshes, sources, pose, dispose };
}
