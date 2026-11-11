import type { AvatarJoint } from './avatar-contracts';
export function jointLimits(joint: AvatarJoint): [number, number, number] {
  if (joint === 'head') return [60, 80, 45];
  if (joint === 'torso') return [45, 60, 45];
  if (joint.startsWith('wrist')) return [80, 80, 80];
  if (joint.startsWith('ankle')) return [60, 45, 45];
  if (joint.startsWith('knee')) return [150, 35, 35];
  if (joint.startsWith('elbow')) return [150, 80, 80];
  return [150, 100, 150];
}
