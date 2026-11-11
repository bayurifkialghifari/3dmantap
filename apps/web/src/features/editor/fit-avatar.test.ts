import { expect, test } from 'bun:test';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import * as THREE from 'three';
import { resolve } from 'node:path';
import { avatarRecipe, defaultAvatar, presetPose, jointBones } from '@3dmantap/shared';
import { fitAvatar } from './fit-avatar';
async function model(file: string) {
  const doc = await new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .read(resolve(import.meta.dir, '../../../public/models', file + '.glb'));
  const all = doc.getRoot().listNodes(),
    joints = new Set(
      doc
        .getRoot()
        .listSkins()
        .flatMap((s) => s.listJoints()),
    );
  const objects = new Map(
    all.map((n) => [n, joints.has(n) ? new THREE.Bone() : new THREE.Group()]),
  );
  const scene = new THREE.Group();
  for (const n of all) {
    const o = objects.get(n)!;
    o.name = n.getName();
    o.position.fromArray(n.getTranslation());
    o.quaternion.fromArray(n.getRotation());
    o.scale.fromArray(n.getScale());
    (objects.get(n.getParentNode()!) ?? scene).add(o);
    for (const p of n.getMesh()?.listPrimitives() ?? []) {
      const geometry = new THREE.BufferGeometry();
      for (const [gltf, name] of Object.entries({
        POSITION: 'position',
        NORMAL: 'normal',
        TEXCOORD_0: 'uv',
        JOINTS_0: 'skinIndex',
        WEIGHTS_0: 'skinWeight',
      })) {
        const a = p.getAttribute(gltf);
        if (!a) continue;
        const values = Array.from({ length: a.getCount() }, (_, i) => a.getElement(i, [])).flat();
        geometry.setAttribute(
          name,
          new THREE.BufferAttribute(
            name === 'skinIndex' ? new Uint16Array(values) : new Float32Array(values),
            a.getElementSize(),
          ),
        );
      }
      geometry.setIndex(Array.from(p.getIndices()!.getArray()!));
      geometry.morphAttributes.position = p.listTargets().map((t) => {
        const a = t.getAttribute('POSITION')!;
        return new THREE.BufferAttribute(
          new Float32Array(
            Array.from({ length: a.getCount() }, (_, i) => a.getElement(i, [])).flat(),
          ),
          3,
        );
      });
      geometry.morphTargetsRelative = true;
      const m = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial());
      m.name = n.getName();
      m.updateMorphTargets();
      m.morphTargetDictionary = Object.fromEntries(p.listTargets().map((t, i) => [t.getName(), i]));
      const skin = n.getSkin()!;
      m.bind(
        new THREE.Skeleton(skin.listJoints().map((j) => objects.get(j) as THREE.Bone)),
        new THREE.Matrix4(),
      );
      o.add(m);
    }
  }
  scene.updateMatrixWorld(true);
  return scene;
}
test('sourced rig fits both bodies and all garments, grounds poses and preserves anatomical stature', async () => {
  const sources = await Promise.all(['avatar', 'tshirt', 'hoodie', 'jacket', 'jeans'].map(model));
  for (const sex of ['male', 'female'] as const) {
    const profile = {
      ...defaultAvatar(1800),
      sex,
      weight: 82000,
      measurements: { waist: 950, arm: 620, inseam: 850, shoulder: 430 },
    };
    const fitted = fitAvatar(sources, avatarRecipe(profile), []);
    expect(fitted.bones).toHaveLength(53);
    const bodyMesh = fitted.meshes.findIndex((m) => m.name === 'Body');
    expect(bodyMesh).toBeGreaterThanOrEqual(0);
    expect(fitted.meshes[bodyMesh].geometry.index!.count).toBeLessThan(
      fitted.sources[bodyMesh].geometry.index!.count,
    );
    const standing = fitted.pose(presetPose('standing'));
    expect(standing.min.y).toBeCloseTo(0, 8);
    expect(standing.max.y).toBeCloseTo(1.8, 5);
    const parent = new THREE.Group();
    parent.scale.setScalar(3);
    parent.position.set(7, -4, 2);
    parent.add(fitted.group);
    parent.updateMatrixWorld(true);
    const sitting = fitted.pose(presetPose('sitting'));
    expect(sitting.min.y).toBeCloseTo(0, 8);
    expect(sitting.max.y).toBeLessThan(1.55);
    expect(sitting.max.y).toBeGreaterThan(0.9);
    const again = fitted.pose(presetPose('standing'));
    expect(again.max.y).toBeCloseTo(1.8, 5);
    for (const [i, mesh] of fitted.meshes.entries()) {
      expect(mesh.skeleton).toBe(fitted.skeleton);
      expect(mesh.geometry.morphAttributes.position).toBeUndefined();
      if (fitted.sources[i].geometry.hasAttribute('uv'))
        expect(mesh.geometry.getAttribute('uv')).toBeDefined();
      expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(
        true,
      );
    }
    const wrist = fitted.bones
      .find((b) => b.name === jointBones.wristL)!
      .getWorldPosition(new THREE.Vector3());
    fitted.pose(presetPose('forward'));
    const forward = fitted.bones
      .find((b) => b.name === jointBones.wristL)!
      .getWorldPosition(new THREE.Vector3());
    expect(forward.distanceTo(wrist)).toBeGreaterThan(0.5);
    fitted.dispose();
  }
}, 20000);
