import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { resolve } from 'node:path';
import { avatarMorphs } from './assets/avatar-morphs';
import { Object3D, Vector3, Quaternion, Euler, Matrix4 } from 'three';
import { format } from 'prettier';
const root = resolve(import.meta.dir, '..');
const doc = await new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .read(resolve(root, '.data/model-source-cache/avatar/model.glb'));
const node = doc
  .getRoot()
  .listNodes()
  .find((n) => n.getMesh()?.getName() === 'base')!;
const p = node.getMesh()!.listPrimitives()[0];
const matrix = node.getWorldMatrix();
const position = p.getAttribute('POSITION')!,
  indices = p.getIndices()!,
  skin = node.getSkin()!;
const joints = skin.listJoints(),
  weights = p.getAttribute('WEIGHTS_0')!,
  jointIds = p.getAttribute('JOINTS_0')!;
const transform = (v: number[], delta = false) =>
  [0, 1, 2].map(
    (a) =>
      matrix[a] * v[0] + matrix[a + 4] * v[1] + matrix[a + 8] * v[2] + (delta ? 0 : matrix[a + 12]),
  );
const vertices = Array.from({ length: position.getCount() }, (_, i) =>
  transform(position.getElement(i, [])),
);
const deltas = Object.fromEntries(
  avatarMorphs.map((name) => {
    const a = p
      .listTargets()
      .find((t) => t.getName() === name)
      ?.getAttribute('POSITION');
    if (!a) throw new Error('Missing morph ' + name);
    return [name, vertices.map((_, i) => transform(a.getElement(i, []), true))];
  }),
);
const anchors = Object.fromEntries(
  joints.map((j) => [j.getName(), j.getWorldMatrix().slice(12, 15)]),
);
const boneDeltas = Object.fromEntries(
  avatarMorphs.map((name) => {
    const sums = joints.map(() => [0, 0, 0, 0]);
    vertices.forEach((_, i) => {
      const ids = jointIds.getElement(i, []),
        ws = weights.getElement(i, []);
      ws.forEach((w, k) => {
        if (w < 0.1) return;
        const s = sums[ids[k]];
        s[3] += w;
        for (let a = 0; a < 3; a++) s[a] += deltas[name][i][a] * w;
      });
    });
    return [
      name,
      Object.fromEntries(
        joints.map((j, i) => [
          j.getName(),
          sums[i].slice(0, 3).map((v) => (sums[i][3] ? v / sums[i][3] : 0)),
        ]),
      ),
    ];
  }),
);
function circumference(points: number[][], y: number) {
  const hits: number[][] = [];
  for (let t = 0; t < indices.getCount(); t += 3) {
    const torso = [0, 1, 2].filter((k) => {
      const i = indices.getScalar(t + k),
        ids = jointIds.getElement(i, []),
        ws = weights.getElement(i, []);
      return (
        ws.reduce(
          (s, w, j) => s + (/^(pelvis|spine|thigh)/.test(joints[ids[j]].getName()) ? w : 0),
          0,
        ) > 0.5
      );
    });
    if (torso.length < 2) continue;
    const tri = [0, 1, 2].map((k) => points[indices.getScalar(t + k)]);
    for (let k = 0; k < 3; k++) {
      const a = tri[k],
        b = tri[(k + 1) % 3];
      if (a[1] > y === b[1] > y) continue;
      const f = (y - a[1]) / (b[1] - a[1]),
        x = a[0] + f * (b[0] - a[0]),
        z = a[2] + f * (b[2] - a[2]);
      if (Math.abs(x) < 0.27) hits.push([x, z]);
    }
  }
  hits.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a: number[], b: number[], c: number[]) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const half = (list: number[][]) => {
    const hull: number[][] = [];
    for (const v of list) {
      while (hull.length > 1 && cross(hull.at(-2)!, hull.at(-1)!, v) <= 0) hull.pop();
      hull.push(v);
    }
    return hull;
  };
  const hull = [...half(hits).slice(0, -1), ...half([...hits].reverse()).slice(0, -1)];
  return hull.reduce((s, a, i) => {
    const b = hull[(i + 1) % hull.length];
    return s + Math.hypot(a[0] - b[0], a[1] - b[1]);
  }, 0);
}
const samples = [];
for (const sex of ['male', 'female'])
  for (const weight of [-1, 0, 1]) {
    const gender = 'gender_' + sex,
      wm = weight < 0 ? 'weight_min' : 'weight_max';
    const morphs: Record<string, number> = {
      [gender]: 1,
      [wm]: Math.abs(weight),
      ['corr_' + gender + '__' + wm]: Math.abs(weight),
    };
    const points = vertices.map((v, i) =>
      v.map((x, a) => x + Object.entries(morphs).reduce((s, [n, w]) => s + deltas[n][i][a] * w, 0)),
    );
    const rig = Object.fromEntries(
      Object.entries(anchors).map(([name, v]) => [
        name,
        v.map(
          (x, a) =>
            x + Object.entries(morphs).reduce((s, [n, w]) => s + boneDeltas[n][name][a] * w, 0),
        ),
      ]),
    );
    const distance = (a: string, b: string) => Math.hypot(...rig[a].map((v, i) => v - rig[b][i]));
    const height = Math.max(...points.map((v) => v[1])) - Math.min(...points.map((v) => v[1]));
    samples.push({
      sex,
      weight,
      height,
      chest: circumference(points, 1.24),
      waist: circumference(points, 1.04),
      hip: circumference(points, 0.9),
      shoulder: distance('upperarm_l', 'upperarm_r'),
      arm: distance('upperarm_l', 'lowerarm_l') + distance('lowerarm_l', 'hand_l'),
      inseam: 0.78,
    });
  }
const jointMap = {
  shoulderL: 'upperarm_l',
  shoulderR: 'upperarm_r',
  elbowL: 'lowerarm_l',
  elbowR: 'lowerarm_r',
  hipL: 'thigh_l',
  hipR: 'thigh_r',
  kneeL: 'calf_l',
  kneeR: 'calf_r',
  ankleL: 'foot_l',
  ankleR: 'foot_r',
};
const presets: Record<string, Record<string, number[]>> = {};
for (const preset of ['standing', 'tpose', 'forward', 'waist', 'sitting']) {
  const objects = new Map(
    joints.map((j) => {
      const o = new Object3D();
      o.position.fromArray(j.getTranslation());
      o.quaternion.fromArray(j.getRotation());
      o.scale.fromArray(j.getScale());
      return [j.getName(), o];
    }),
  );
  const rest = new Map([...objects].map(([n, o]) => [n, o.quaternion.clone()]));
  const rig = new Object3D();
  for (const j of joints)
    (objects.get(j.getParentNode()?.getName() ?? '') ?? rig).add(objects.get(j.getName())!);
  const aim = (name: string, child: string, direction: number[]) => {
    rig.updateMatrixWorld(true);
    const o = objects.get(name)!,
      c = objects.get(child)!;
    const axis = c
      .getWorldPosition(new Vector3())
      .sub(o.getWorldPosition(new Vector3()))
      .normalize();
    const desired = new Quaternion()
      .setFromUnitVectors(axis, new Vector3().fromArray(direction).normalize())
      .multiply(o.getWorldQuaternion(new Quaternion()));
    o.quaternion.copy(o.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(desired));
  };
  for (const side of ['l', 'r']) {
    const sign = side === 'l' ? 1 : -1;
    const upper =
      preset === 'tpose'
        ? [sign, 0, 0]
        : preset === 'forward'
          ? [sign * 0.1, 0, 1]
          : preset === 'waist'
            ? [sign * 0.65, -0.75, -0.1]
            : [sign * 0.08, -1, 0];
    const lower = preset === 'waist' ? [-sign * 0.9, 0.3, 0.2] : upper;
    aim('upperarm_' + side, 'lowerarm_' + side, upper);
    aim('lowerarm_' + side, 'hand_' + side, lower);
    aim('thigh_' + side, 'calf_' + side, preset === 'sitting' ? [0, 0, 1] : [0, -1, 0]);
    aim('calf_' + side, 'foot_' + side, [0, -1, 0]);
    aim('foot_' + side, 'ball_' + side, [0, 0, 1]);
  }
  presets[preset] = Object.fromEntries(
    Object.entries(jointMap).map(([key, name]) => {
      const q = rest.get(name)!.clone().invert().multiply(objects.get(name)!.quaternion);
      const e = new Euler().setFromQuaternion(q, 'XYZ');
      return [key, [e.x, e.y, e.z].map((v) => Math.round(((v * 180) / Math.PI) * 100) / 100)];
    }),
  );
}
const round = (_key: string, value: unknown) =>
  typeof value === 'number' ? Math.round(value * 1e7) / 1e7 : value;
const boneRest = Object.fromEntries(
  joints.map((j) => {
    const rotation = new Quaternion();
    new Matrix4().fromArray(j.getWorldMatrix()).decompose(new Vector3(), rotation, new Vector3());
    return [
      j.getName(),
      {
        parent: joints.includes(j.getParentNode()!) ? j.getParentNode()!.getName() : null,
        rotation: rotation.toArray(),
      },
    ];
  }),
);
await Bun.write(
  resolve(root, 'packages/shared/src/avatar-calibration.json'),
  await format(JSON.stringify({ anchors, boneDeltas, samples, presets, boneRest }, round), {
    parser: 'json',
    printWidth: 100,
  }),
);
console.log('Calibrated avatar body samples and five bind-relative poses.');
