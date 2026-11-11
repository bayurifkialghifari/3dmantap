import { Accessor, type Document, type Primitive } from '@gltf-transform/core';
import { dedup, prune } from '@gltf-transform/functions';

// Extract connected physical components from the sourced cabinet, keeping its UVs.
function largestBoard(source: Primitive): number[] {
  const positions = source.getAttribute('POSITION')!,
    indices = source.getIndices()!;
  const groups = new Map<string, number>(),
    parent: number[] = [];
  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index]);
    return parent[index];
  };
  const vertices = Array.from({ length: positions.getCount() }, (_, index) => {
    const key = positions
      .getElement(index, [0, 0, 0])
      .map((n) => Math.round(n * 100000))
      .join(',');
    if (!groups.has(key)) {
      groups.set(key, parent.length);
      parent.push(parent.length);
    }
    return groups.get(key)!;
  });
  for (let i = 0; i < indices.getCount(); i += 3) {
    const a = vertices[indices.getScalar(i)];
    parent[find(vertices[indices.getScalar(i + 1)])] = find(a);
    parent[find(vertices[indices.getScalar(i + 2)])] = find(a);
  }
  const components = new Map<number, number[]>();
  for (let i = 0; i < indices.getCount(); i += 3) {
    const root = find(vertices[indices.getScalar(i)]),
      faces = components.get(root) ?? [];
    faces.push(indices.getScalar(i), indices.getScalar(i + 1), indices.getScalar(i + 2));
    components.set(root, faces);
  }
  const result = [...components.values()].sort((a, b) => b.length - a.length)[0];
  if (!result?.length) throw new Error('Cabinet source has no connected board.');
  return result;
}

export async function furnitureParts(doc: Document): Promise<void> {
  const buffer = doc.getRoot().listBuffers()[0];
  const body = doc
    .getRoot()
    .listMeshes()
    .find((m) => m.getName().endsWith('_body'))
    ?.listPrimitives()[0];
  const door = doc
    .getRoot()
    .listMeshes()
    .find((m) => m.getName().endsWith('_door_l'))
    ?.listPrimitives()[0];
  if (!body || !door) throw new Error('Cabinet source mesh names have changed.');
  const add = (name: string, source: Primitive, faces: number[], axes: number[]) => {
    const old = source.getAttribute('POSITION')!,
      vertices = [...new Set(faces)];
    const mapping = new Map(vertices.map((v, i) => [v, i]));
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (const v of vertices)
      old.getElement(v, [0, 0, 0]).forEach((n, a) => {
        min[a] = Math.min(min[a], n);
        max[a] = Math.max(max[a], n);
      });
    const sizes = max.map((n, a) => n - min[a]),
      center = max.map((n, a) => (n + min[a]) / 2);
    if (sizes.some((n) => !Number.isFinite(n) || n <= 0))
      throw new Error('Invalid source component bounds.');
    const primitive = doc.createPrimitive().setMaterial(source.getMaterial());
    for (const semantic of source.listSemantics()) {
      const attr = source.getAttribute(semantic)!,
        size = attr.getElementSize();
      const array = new Float32Array(vertices.length * size);
      vertices.forEach((v, i) => {
        let point = attr.getElement(v, Array<number>(size).fill(0));
        if (semantic === 'POSITION')
          point = axes.map((axis) => {
            const a = Math.abs(axis) - 1;
            return (Math.sign(axis) * (point[a] - center[a])) / sizes[a];
          });
        if (semantic === 'NORMAL' || semantic === 'TANGENT') {
          const vector = axes.map((axis) => {
            const a = Math.abs(axis) - 1;
            return Math.sign(axis) * point[a] * (semantic === 'NORMAL' ? sizes[a] : 1 / sizes[a]);
          });
          const length = Math.hypot(...vector);
          point = [...vector.map((n) => n / length), ...point.slice(3)];
        }
        array.set(point, i * size);
      });
      primitive.setAttribute(
        semantic,
        doc.createAccessor().setType(attr.getType()).setArray(array).setBuffer(buffer),
      );
    }
    primitive.setIndices(
      doc
        .createAccessor()
        .setType(Accessor.Type.SCALAR)
        .setArray(new Uint32Array(faces.map((v) => mapping.get(v)!)))
        .setBuffer(buffer),
    );
    return doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive));
  };
  const nodes = [
    add('board', body, largestBoard(body), [1, 3, -2]),
    add('door', door, Array.from(door.getIndices()!.getArray()!), [1, 2, 3]),
  ];
  doc
    .getRoot()
    .listScenes()
    .forEach((s) => s.dispose());
  doc
    .getRoot()
    .listNodes()
    .filter((n) => !nodes.includes(n))
    .forEach((n) => n.dispose());
  const scene = doc.createScene('Sourced cabinet components');
  nodes.forEach((n) => scene.addChild(n));
  await doc.transform(prune(), dedup());
}
