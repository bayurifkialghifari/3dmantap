import { expect, test } from 'bun:test';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { productModelScale, productModels } from './models';
import { starterTemplates } from './templates';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const folder = resolve(import.meta.dir, '../../../apps/web/public/models');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
test('sneaker keeps the sourced proportions at the configured length', async () => {
  const document = await io.read(resolve(folder, 'sneaker.glb'));
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  document
    .getRoot()
    .listScenes()[0]
    .traverse((node) => {
      const matrix = node.getWorldMatrix();
      for (const primitive of node.getMesh()?.listPrimitives() ?? []) {
        const positions = primitive.getAttribute('POSITION')!;
        for (let i = 0; i < positions.getCount(); i++) {
          const [x, y, z] = positions.getElement(i, [0, 0, 0]);
          for (let axis = 0; axis < 3; axis++) {
            const value =
              matrix[axis] * x + matrix[axis + 4] * y + matrix[axis + 8] * z + matrix[axis + 12];
            bounds.min[axis] = Math.min(bounds.min[axis], value);
            bounds.max[axis] = Math.max(bounds.max[axis], value);
          }
        }
      }
    });
  const size = {
    x: bounds.max[0] - bounds.min[0],
    y: bounds.max[1] - bounds.min[1],
    z: bounds.max[2] - bounds.min[2],
  };
  const template = starterTemplates.find((t) => t.modelKind === 'shoe')!;
  expect(productModels.shoe.rotation).toEqual([0, 0, 0]);
  const scale = productModelScale(template, template.dimensions, size);
  const actual = [size.x * scale[0], size.y * scale[1], size.z * scale[2]];
  expect(Math.max(actual[0], actual[2])).toBeCloseTo(0.32, 6);
  expect(actual[1] / actual[0]).toBeCloseTo(size.y / size.x, 6);
  expect(actual[2] / actual[0]).toBeCloseTo(size.z / size.x, 6);
  expect(actual[1]).toBeGreaterThan(0.15);
  expect(actual[2]).toBeGreaterThan(0.1);
});
test('bundled GLBs match their manifest and contain finite, self-contained mesh data', async () => {
  const manifest = (await Bun.file(resolve(folder, 'manifest.json')).json()) as {
    file: string;
    sha256: string;
    bytes: number;
  }[];
  expect(manifest).toHaveLength(8);
  for (const asset of manifest) {
    const bytes = await Bun.file(resolve(folder, asset.file)).bytes();
    expect(bytes.length).toBe(asset.bytes);
    expect(bytes.length).toBeLessThan(5 * 1024 * 1024);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(view.getUint32(4, true)).toBe(2);
    expect(view.getUint32(8, true)).toBe(bytes.length);
    const json = JSON.parse(
      new TextDecoder().decode(bytes.subarray(20, 20 + view.getUint32(12, true))),
    ) as { buffers: { uri?: string }[]; images?: { uri?: string }[] };
    expect(
      [...json.buffers, ...(json.images ?? [])].some(
        (resource) => resource.uri && !resource.uri.startsWith('data:'),
      ),
    ).toBe(false);
    const doc = await io.read(resolve(folder, asset.file));
    expect(doc.getRoot().listScenes().length).toBeGreaterThan(0);
    expect(doc.getRoot().listMeshes().length).toBeGreaterThan(0);
    for (const mesh of doc.getRoot().listMeshes())
      for (const primitive of mesh.listPrimitives()) {
        const positions = primitive.getAttribute('POSITION')!;
        expect(positions.getCount()).toBeGreaterThan(3);
        expect(Array.from(positions.getArray()!).every(Number.isFinite)).toBe(true);
        expect(primitive.listTargets()).toHaveLength(0);
      }
  }
});

test('sourced cabinet parts are centered unit panels with original UVs and PBR maps', async () => {
  const doc = await io.read(resolve(folder, 'furniture-parts.glb'));
  expect(
    doc
      .getRoot()
      .listMeshes()
      .map((m) => m.getName())
      .sort(),
  ).toEqual(['board', 'door']);
  for (const mesh of doc.getRoot().listMeshes()) {
    const p = mesh.listPrimitives()[0],
      positions = p.getAttribute('POSITION')!;
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.getCount(); i++)
      positions.getElement(i, [0, 0, 0]).forEach((v, a) => {
        min[a] = Math.min(min[a], v);
        max[a] = Math.max(max[a], v);
      });
    for (let a = 0; a < 3; a++) {
      expect(min[a]).toBeCloseTo(-0.5, 5);
      expect(max[a]).toBeCloseTo(0.5, 5);
    }
    expect(p.getAttribute('TEXCOORD_0')).not.toBeNull();
    expect(p.getMaterial()?.getBaseColorTexture()).not.toBeNull();
    expect(p.getMaterial()?.getNormalTexture()).not.toBeNull();
  }
});
