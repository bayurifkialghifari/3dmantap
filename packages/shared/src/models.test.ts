import { expect, test } from 'bun:test';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const folder = resolve(import.meta.dir, '../../../apps/web/public/models');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
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
