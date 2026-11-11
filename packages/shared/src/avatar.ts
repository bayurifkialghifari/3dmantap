import calibration from './avatar-calibration.json' with { type: 'json' };
import { posedLandmarks } from './avatar-pose';
import { jointLimits } from './avatar-joints';
export { jointLimits } from './avatar-joints';
import type {
  AvatarJoint,
  AvatarMeasure,
  AvatarPose,
  AvatarProfile,
  AvatarRenderRecipe,
} from './avatar-contracts';
import type { DesignDocument, RoomProject } from './contracts';
export const jointBones: Record<AvatarJoint, string> = {
  head: 'head',
  torso: 'spine_03',
  shoulderL: 'upperarm_l',
  shoulderR: 'upperarm_r',
  elbowL: 'lowerarm_l',
  elbowR: 'lowerarm_r',
  wristL: 'hand_l',
  wristR: 'hand_r',
  hipL: 'thigh_l',
  hipR: 'thigh_r',
  kneeL: 'calf_l',
  kneeR: 'calf_r',
  ankleL: 'foot_l',
  ankleR: 'foot_r',
};
export const jointLabels: Record<AvatarJoint, string> = {
  head: 'Kepala',
  torso: 'Torso',
  shoulderL: 'Bahu kiri',
  shoulderR: 'Bahu kanan',
  elbowL: 'Siku kiri',
  elbowR: 'Siku kanan',
  wristL: 'Pergelangan kiri',
  wristR: 'Pergelangan kanan',
  hipL: 'Pinggul kiri',
  hipR: 'Pinggul kanan',
  kneeL: 'Lutut kiri',
  kneeR: 'Lutut kanan',
  ankleL: 'Pergelangan kaki kiri',
  ankleR: 'Pergelangan kaki kanan',
};
export const poseLabels: Record<AvatarPose['preset'], string> = {
  standing: 'Berdiri santai',
  tpose: 'T-pose',
  forward: 'Tangan ke depan',
  waist: 'Tangan di pinggang',
  sitting: 'Duduk',
};
export function presetPose(preset: AvatarPose['preset']): AvatarPose {
  return { preset, joints: structuredClone(calibration.presets[preset]) as AvatarPose['joints'] };
}
export function defaultAvatar(height = 1700): AvatarProfile {
  return {
    version: 1,
    sex: 'male',
    height,
    weight: 65000,
    measurements: {},
    pose: presetPose('standing'),
  };
}
export function setJoint(pose: AvatarPose, joint: AvatarJoint, rotation: number[]): AvatarPose {
  const limits = jointLimits(joint);
  return {
    ...pose,
    joints: {
      ...pose.joints,
      [joint]: rotation.map((v, i) => Math.max(-limits[i], Math.min(limits[i], v))) as [
        number,
        number,
        number,
      ],
    },
  };
}
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
function bodyBasis(profile: AvatarProfile) {
  const bmi = profile.weight / 1000 / (profile.height / 1000) ** 2;
  const weight = clamp((bmi - 22.5) / (bmi < 22.5 ? 7 : 15), -1, 1);
  const gender = 'gender_' + profile.sex,
    wm = weight < 0 ? 'weight_min' : 'weight_max';
  const morphs: Record<string, number> = {
    [gender]: 1,
    [wm]: Math.abs(weight),
    ['corr_' + gender + '__' + wm]: Math.abs(weight),
  };
  const neutral = calibration.samples.find((s) => s.sex === profile.sex && s.weight === 0)!;
  const extreme = calibration.samples.find(
    (s) => s.sex === profile.sex && s.weight === (weight < 0 ? -1 : 1),
  )!;
  const sample = Object.fromEntries(
    ['height', 'chest', 'waist', 'hip', 'shoulder', 'arm', 'inseam'].map((k) => {
      const key = k as keyof Omit<typeof neutral, 'sex' | 'weight'>;
      return [k, neutral[key] + (extreme[key] - neutral[key]) * Math.abs(weight)];
    }),
  ) as Record<AvatarMeasure | 'height', number>;
  return { sample, morphs };
}
export function avatarMeasurements(profile: AvatarProfile): Record<AvatarMeasure, number> {
  const { sample } = bodyBasis(profile),
    factor = profile.height / sample.height;
  return Object.fromEntries(
    ['chest', 'waist', 'hip', 'shoulder', 'arm', 'inseam'].map((k) => [
      k,
      profile.measurements[k as AvatarMeasure] ?? Math.round(sample[k as AvatarMeasure] * factor),
    ]),
  ) as Record<AvatarMeasure, number>;
}
type Point = [number, number, number];
export function avatarRecipe(profile: AvatarProfile): AvatarRenderRecipe {
  const { sample, morphs } = bodyBasis(profile),
    measures = avatarMeasurements(profile);
  const factor = profile.height / 1000 / sample.height;
  const leg = clamp(measures.inseam / 1000 / factor / 0.78, 0.5, 1.45);
  const torso = clamp((sample.height - 0.78 * leg - (sample.height - 1.4)) / 0.62, 0.25, 1.8);
  const anchors = Object.fromEntries(
    Object.entries(calibration.anchors).map(([name, p]) => [
      name,
      p.map(
        (v, a) =>
          v +
          Object.entries(morphs).reduce(
            (s, [n, w]) =>
              s +
              (calibration.boneDeltas as Record<string, Record<string, number[]>>)[n][name][a] * w,
            0,
          ),
      ) as Point,
    ]),
  );
  const stretch: [number, number, number] = [factor, leg, torso];
  const y = (v: number) => stretchedY(v, stretch);
  const dist = (a: Point, b: Point) =>
    Math.hypot((a[0] - b[0]) * factor, y(a[1]) - y(b[1]), (a[2] - b[2]) * factor);
  const length =
    dist(anchors.upperarm_l, anchors.lowerarm_l) + dist(anchors.lowerarm_l, anchors.hand_l);
  return {
    version: 1,
    morphs,
    stature: profile.height / 1000,
    stretch,
    girth: [
      measures.hip / (sample.hip * factor * 1000),
      measures.waist / (sample.waist * factor * 1000),
      measures.chest / (sample.chest * factor * 1000),
    ],
    shoulder: measures.shoulder / (sample.shoulder * factor * 1000),
    arm: measures.arm / 1000 / length,
    anchors,
    pose: profile.pose,
  };
}
function stretchedY(y: number, [factor, leg, torso]: number[]) {
  return (
    factor *
    (y < 0.78
      ? y * leg
      : y < 1.4
        ? 0.78 * leg + (y - 0.78) * torso
        : 0.78 * leg + 0.62 * torso + y - 1.4)
  );
}
function girthAt(y: number, g: number[]) {
  const knots = [0.7, 0.9, 1.04, 1.24, 1.4],
    values = [1, g[0], g[1], g[2], 1];
  for (let i = 1; i < knots.length; i++)
    if (y <= knots[i]) {
      const t = clamp((y - knots[i - 1]) / (knots[i] - knots[i - 1]), 0, 1);
      return values[i - 1] + (values[i] - values[i - 1]) * t;
    }
  return 1;
}
export function deformAvatarPoint(
  point: Point,
  recipe: AvatarRenderRecipe,
  armWeight = 0,
  side = point[0] >= 0 ? 'l' : 'r',
): Point {
  const [factor] = recipe.stretch,
    [x, y, z] = point;
  const girth = girthAt(y, recipe.girth);
  const base: Point = [x * girth * factor, stretchedY(y, recipe.stretch), z * girth * factor];
  if (!armWeight) return base;
  const shoulder = recipe.anchors['upperarm_' + side];
  if (!shoulder) return base;
  const origin: Point = [
    shoulder[0] * factor,
    stretchedY(shoulder[1], recipe.stretch),
    shoulder[2] * factor,
  ];
  const arm: Point = [
    origin[0] * recipe.shoulder + (x * factor - origin[0]) * recipe.arm,
    origin[1] + (stretchedY(y, recipe.stretch) - origin[1]) * recipe.arm,
    origin[2] + (z * factor - origin[2]) * recipe.arm,
  ];
  return base.map((v, i) => v + (arm[i] - v) * armWeight) as Point;
}
export function recipeFor(
  value: { avatar?: AvatarProfile; avatarRecipe?: AvatarRenderRecipe },
  height = 1700,
) {
  return value.avatar
    ? avatarRecipe(value.avatar)
    : (value.avatarRecipe ?? avatarRecipe(defaultAvatar(height)));
}
export function publicDesign(document: DesignDocument): DesignDocument {
  const { avatar, avatarRecipe: recipe, ...rest } = document;
  return avatar || recipe
    ? { ...rest, avatarRecipe: avatar ? avatarRecipe(avatar) : recipe }
    : rest;
}
export function publicRoom(room: RoomProject): RoomProject {
  const person = room.person;
  return {
    ...room,
    items: room.items.map((i) => ({ ...i, document: publicDesign(i.document) })),
    person: person
      ? {
          x: person.x,
          y: person.y,
          rotation: person.rotation,
          height:
            person.avatar?.height ??
            Math.round((person.avatarRecipe?.stature ?? person.height / 1000) * 1000),
          avatarRecipe: recipeFor(person, person.height),
        }
      : undefined,
  };
}
export function avatarFootprint(recipe: AvatarRenderRecipe): [number, number] {
  const anchors = Object.fromEntries(
    Object.entries(recipe.anchors).map(([name, p]) => [
      name,
      deformAvatarPoint(
        p,
        recipe,
        /^(upperarm|lowerarm|hand|index|middle|pinky|ring|thumb)/.test(name)
          ? 1
          : name.startsWith('clavicle')
            ? 0.5
            : 0,
        name.endsWith('_r') ? 'r' : 'l',
      ),
    ]),
  );
  const angles = Object.fromEntries(
    Object.entries(recipe.pose.joints).map(([j, v]) => [jointBones[j as AvatarJoint], v!]),
  );
  const points = Object.values(posedLandmarks(anchors, angles));
  const size = (axis: number, pad: number) =>
    Math.max(
      280,
      (Math.max(...points.map((p) => p[axis])) - Math.min(...points.map((p) => p[axis])) + pad) *
        1000,
    );
  return [size(0, 0.12), size(2, 0.18)];
}
