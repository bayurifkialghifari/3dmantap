import { expect, test } from 'bun:test';
import {
  defaultAvatar,
  avatarRecipe,
  avatarMeasurements,
  publicDesign,
  publicRoom,
  presetPose,
  setJoint,
  recipeFor,
  avatarFootprint,
} from './avatar';
import { avatarProfileSchema, avatarRenderRecipeSchema } from './avatar-contracts';
import { createDesign } from './design';
import { defaultRoom } from './templates';
import { starterTemplates } from './templates';
import { designSchema, roomSchema } from './contracts';
import { roomPlanSvg } from './room-export';
test('legacy JSON remains valid and mm/grams profiles validate without a schema migration', () => {
  const d = createDesign(starterTemplates[0]);
  expect(designSchema.parse(d).avatar).toBeUndefined();
  expect(roomSchema.parse(defaultRoom)).toBeDefined();
  const a = defaultAvatar();
  expect(avatarProfileSchema.parse(a)).toEqual(a);
  expect(avatarProfileSchema.safeParse({ ...a, weight: 65 }).success).toBe(false);
  expect(avatarProfileSchema.safeParse({ ...a, height: 170 }).success).toBe(false);
  for (const sex of ['male', 'female'] as const)
    for (const height of [1000, 1700, 2200])
      for (const weight of [25000, 65000, 200000])
        expect(
          avatarRenderRecipeSchema.safeParse(avatarRecipe({ ...a, sex, height, weight })).success,
        ).toBe(true);
});
test('manual measurements override calibration; weight and gender change sourced deformation', () => {
  const a = defaultAvatar(),
    baseline = avatarMeasurements(a),
    heavy = avatarRecipe({ ...a, weight: 100000 }),
    female = avatarRecipe({ ...a, sex: 'female' });
  expect(heavy.morphs.weight_max).toBeGreaterThan(0);
  expect(female.morphs.gender_female).toBe(1);
  const custom = { ...a, measurements: { waist: 1000, arm: 650, shoulder: 450, inseam: 850 } };
  expect(avatarMeasurements(custom)).toMatchObject(custom.measurements);
  expect(baseline.waist).toBeGreaterThan(600);
  expect(avatarRecipe(custom).girth[1]).toBeGreaterThan(1.2);
  const customPose = { ...avatarRecipe(a), pose: setJoint(a.pose, 'shoulderL', [0, 0, 90]) };
  expect(avatarFootprint(customPose)[0]).toBeGreaterThan(avatarFootprint(avatarRecipe(a))[0]);
  expect(avatarProfileSchema.safeParse({ ...a, measurements: { inseam: 1200 } }).success).toBe(
    false,
  );
  expect(
    avatarRenderRecipeSchema.safeParse({ ...avatarRecipe(a), anchors: { weight: [65, 0, 0] } })
      .success,
  ).toBe(false);
  expect(
    avatarRenderRecipeSchema.safeParse({ ...avatarRecipe(a), morphs: { weight: 65 } }).success,
  ).toBe(false);
  expect(setJoint(a.pose, 'head', [400, 400, -400]).joints.head).toEqual([60, 80, -45]);
  expect(presetPose('sitting').joints.hipL).not.toEqual(a.pose.joints.hipL);
  expect(avatarFootprint({ ...avatarRecipe(a), pose: presetPose('tpose') })[0]).toBeGreaterThan(
    avatarFootprint(avatarRecipe(a))[0],
  );
});
test('public projections strip all raw avatar profiles recursively and preserve the exact visual recipe', () => {
  const a = {
      ...defaultAvatar(),
      sex: 'female' as const,
      weight: 73500,
      measurements: { waist: 825, arm: 580 },
      pose: presetPose('sitting'),
    },
    d = { ...createDesign(starterTemplates[0]), avatar: a };
  const shared = publicDesign(d);
  expect(shared.avatar).toBeUndefined();
  expect(shared.avatarRecipe).toEqual(avatarRecipe(a));
  expect(d.avatar).toEqual(a);
  const room = {
    ...structuredClone(defaultRoom),
    person: { x: 1200, y: 1300, rotation: 40, height: 1700, avatar: a },
    items: [{ id: 'item', x: 0, y: 0, rotation: 0, document: d }],
  };
  const copy = publicRoom(room),
    json = JSON.stringify(copy);
  for (const key of ['weight', 'measurements', 'chest', 'waist', 'hip', 'inseam'])
    expect(json).not.toContain('"' + key + '":');
  expect(copy.items[0].document.avatar).toBeUndefined();
  expect(recipeFor(copy.person!)).toEqual(avatarRecipe(a));
  expect(publicRoom(copy)).toEqual(copy);
});
test('SVG footprint follows joint poses while height labels keep standing stature', () => {
  const room = {
    ...structuredClone(defaultRoom),
    person: { x: 1000, y: 1000, rotation: 45, height: 1700, avatar: defaultAvatar() },
  };
  const normal = roomPlanSvg(room);
  room.person.avatar.pose = presetPose('tpose');
  const wide = roomPlanSvg(room);
  expect(Number(wide.match(/<ellipse rx="([\d.]+)"/)![1])).toBeGreaterThan(
    Number(normal.match(/<ellipse rx="([\d.]+)"/)![1]),
  );
  expect(wide).toContain('data-person-height="1700"');
  expect(wide).toContain('rotate(45)');
});
