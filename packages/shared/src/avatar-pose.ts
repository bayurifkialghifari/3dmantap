import calibration from './avatar-calibration.json' with { type: 'json' };
type Quat = [number, number, number, number];
type Point = [number, number, number];
const multiply = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const inverse = (q: Quat): Quat => [-q[0], -q[1], -q[2], q[3]];
function rotate(q: Quat, p: Point): Point {
  const v = multiply(multiply(q, [...p, 0]), inverse(q));
  return [v[0], v[1], v[2]];
}
function euler(degrees: number[]): Quat {
  const [x, y, z] = degrees.map((v) => (v * Math.PI) / 360),
    a = Math.cos(x),
    b = Math.sin(x),
    c = Math.cos(y),
    d = Math.sin(y),
    e = Math.cos(z),
    f = Math.sin(z);
  return [
    b * c * e + a * d * f,
    a * d * e - b * c * f,
    a * c * f + b * d * e,
    a * c * e - b * d * f,
  ];
}
// Same bind-relative hierarchy as the renderer, using math only (no GPU/server GLB parsing).
export function posedLandmarks(
  anchors: Record<string, Point>,
  rotations: Record<string, number[]>,
): Record<string, Point> {
  const rest = calibration.boneRest as Record<
    string,
    { parent: string | null; rotation: number[] }
  >;
  const result: Record<string, { position: Point; rotation: Quat }> = {};
  for (const [name, bone] of Object.entries(rest)) {
    const source = anchors[name];
    if (!source) continue;
    const bind = bone.rotation as Quat,
      parent = bone.parent ? result[bone.parent] : undefined;
    const parentBind = bone.parent ? (rest[bone.parent].rotation as Quat) : ([0, 0, 0, 1] as Quat);
    const localRotation = multiply(
      multiply(inverse(parentBind), bind),
      euler(rotations[name] ?? [0, 0, 0]),
    );
    if (parent && bone.parent) {
      const local = rotate(
        inverse(parentBind),
        source.map((v, i) => v - anchors[bone.parent!][i]) as Point,
      );
      const moved = rotate(parent.rotation, local);
      result[name] = {
        position: parent.position.map((v, i) => v + moved[i]) as Point,
        rotation: multiply(parent.rotation, localRotation),
      };
    } else result[name] = { position: source, rotation: localRotation };
  }
  return Object.fromEntries(Object.entries(result).map(([n, v]) => [n, v.position]));
}
