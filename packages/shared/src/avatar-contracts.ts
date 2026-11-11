import { z } from 'zod';
import calibration from './avatar-calibration.json' with { type: 'json' };
import { jointLimits } from './avatar-joints';
export const avatarJointNames = [
  'head',
  'torso',
  'shoulderL',
  'shoulderR',
  'elbowL',
  'elbowR',
  'wristL',
  'wristR',
  'hipL',
  'hipR',
  'kneeL',
  'kneeR',
  'ankleL',
  'ankleR',
] as const;
export type AvatarJoint = (typeof avatarJointNames)[number];
export const poseNames = ['standing', 'tpose', 'forward', 'waist', 'sitting'] as const;
const angle = z.number().finite().min(-180).max(180);
export const avatarPoseSchema = z
  .object({
    preset: z.enum(poseNames),
    joints: z.partialRecord(z.enum(avatarJointNames), z.tuple([angle, angle, angle])),
  })
  .refine(
    (p) =>
      Object.entries(p.joints).every(([j, a]) =>
        a!.every((v, i) => Math.abs(v) <= jointLimits(j as AvatarJoint)[i]),
      ),
    'Rotasi sendi melewati batas',
  );
export type AvatarPose = z.infer<typeof avatarPoseSchema>;
export const measurementLimits = {
  chest: [500, 1800],
  waist: [400, 1800],
  hip: [500, 1800],
  shoulder: [250, 650],
  arm: [350, 900],
  inseam: [400, 1200],
} as const;
export const avatarProfileSchema = z
  .object({
    version: z.literal(1),
    sex: z.enum(['male', 'female']),
    height: z.number().int().min(1000).max(2200),
    weight: z.number().int().min(25000).max(200000),
    measurements: z.object({
      chest: z.number().int().min(500).max(1800).optional(),
      waist: z.number().int().min(400).max(1800).optional(),
      hip: z.number().int().min(500).max(1800).optional(),
      shoulder: z.number().int().min(250).max(650).optional(),
      arm: z.number().int().min(350).max(900).optional(),
      inseam: z.number().int().min(400).max(1200).optional(),
    }),
    pose: avatarPoseSchema,
  })
  .refine(
    (p) =>
      p.measurements.inseam === undefined || p.measurements.inseam <= Math.floor(p.height * 0.65),
    'Panjang kaki bagian dalam terlalu besar untuk tinggi tubuh',
  );
export type AvatarProfile = z.infer<typeof avatarProfileSchema>;
export type AvatarMeasure = keyof AvatarProfile['measurements'];
const scale = z.number().finite().min(0.15).max(5);
const coordinate = z.number().finite().min(-5).max(5);
const point = z.tuple([coordinate, coordinate, coordinate]);
const morphNames = [
  'gender_female',
  'gender_male',
  'weight_min',
  'weight_max',
  'corr_gender_female__weight_min',
  'corr_gender_female__weight_max',
  'corr_gender_male__weight_min',
  'corr_gender_male__weight_max',
] as const;
// Public geometry recipe contains coefficients, never weight or measurement fields.
export const avatarRenderRecipeSchema = z.object({
  version: z.literal(1),
  morphs: z.partialRecord(z.enum(morphNames), z.number().finite().min(0).max(1)),
  stature: z.number().min(1).max(2.2),
  stretch: z.tuple([scale, scale, scale]),
  girth: z.tuple([scale, scale, scale]),
  shoulder: scale,
  arm: scale,
  anchors: z.record(z.enum(Object.keys(calibration.anchors) as [string, ...string[]]), point),
  pose: avatarPoseSchema,
});
export type AvatarRenderRecipe = z.infer<typeof avatarRenderRecipeSchema>;
