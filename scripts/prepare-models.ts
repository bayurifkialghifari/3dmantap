import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, type MappingList } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { resolve, relative, dirname, isAbsolute } from 'node:path';
import sources from './assets/model-sources.json';
import { furnitureParts } from './assets/furniture-parts';
import { avatarMorphs } from './assets/avatar-morphs';

const root = resolve(import.meta.dir, '..');
const output = resolve(root, 'apps/web/public/models');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const built: { file: string; sha256: string; bytes: number }[] = [];
await mkdir(output, { recursive: true });
for (const pack of sources) {
  const folder = resolve(root, '.data/model-source-cache', pack.name);
  for (const file of pack.files) {
    const target = resolve(folder, file.path),
      path = relative(folder, target);
    if (path.startsWith('..') || isAbsolute(path))
      throw new Error('Source resource escapes cache.');
    let bytes = await Bun.file(target)
      .bytes()
      .catch(() => null);
    if (!bytes || sha256(bytes) !== file.sha256) {
      const response = await fetch(file.url);
      if (!response.ok)
        throw new Error('Source download failed: ' + pack.name + ' (' + response.status + ')');
      bytes = new Uint8Array(await response.arrayBuffer());
      if (sha256(bytes) !== file.sha256)
        throw new Error(
          'Source changed: ' +
            pack.name +
            '/' +
            file.path +
            '. Review provenance before updating the manifest.',
        );
      await mkdir(dirname(target), { recursive: true });
      await Bun.write(target, bytes);
    }
  }
  const doc = await io.read(resolve(folder, pack.format === 'gltf' ? 'model.gltf' : 'model.glb'));
  let name = pack.name;
  if (name === 'modern_wooden_cabinet') {
    await furnitureParts(doc);
    name = 'furniture-parts';
  } else {
    const character = ['avatar', 'tshirt', 'hoodie', 'jacket', 'jeans'].includes(name);
    doc
      .getRoot()
      .listMeshes()
      .forEach((mesh) =>
        mesh.listPrimitives().forEach((p) =>
          p.listTargets().forEach((target) => {
            if (!character || !avatarMorphs.includes(target.getName())) p.removeTarget(target);
          }),
        ),
      );
    for (const mesh of doc.getRoot().listMeshes()) {
      mesh.setWeights([]);
      mesh.setExtras(
        character
          ? {
              targetNames: mesh
                .listPrimitives()[0]
                .listTargets()
                .map((t) => t.getName()),
            }
          : {},
      );
    }
    doc
      .getRoot()
      .listNodes()
      .forEach((node) => node.setWeights([]));
    if (name === 'avatar')
      await doc.transform(
        prune(),
        textureCompress({ encoder: sharp, resize: [1024, 1024], quality: 88 }),
      );
    // The source tee carries a mannequin logo. Use plain cotton for customer artwork.
    if (name === 'tshirt')
      doc
        .getRoot()
        .listMaterials()
        .forEach((m) => m.setBaseColorTexture(null).setRoughnessFactor(1));
    // Use the source's neutral beach variant, retaining its original PBR maps.
    if (name === 'sneaker') {
      doc
        .getRoot()
        .listMeshes()
        .forEach((mesh) =>
          mesh.listPrimitives().forEach((p) => {
            const beach = p
              .getExtension<MappingList>('KHR_materials_variants')
              ?.listMappings()
              .find((m) => m.listVariants().some((v) => v.getName() === 'beach'));
            if (!beach?.getMaterial()) throw new Error('Shoe beach variant missing.');
            p.setMaterial(beach.getMaterial());
          }),
        );
      doc
        .getRoot()
        .listExtensionsUsed()
        .filter((e) => e.extensionName === 'KHR_materials_variants')
        .forEach((e) => e.dispose());
      await doc.transform(
        prune(),
        textureCompress({
          encoder: sharp,
          targetFormat: 'jpeg',
          resize: [1024, 1024],
          quality: 88,
        }),
      );
    }
    if (name === 'fishermans_hat') {
      for (const m of doc.getRoot().listMaterials()) {
        const texture = m.getBaseColorTexture();
        if (texture?.getImage())
          texture
            .setImage(
              await sharp(texture.getImage()!)
                .grayscale()
                .linear(0.65, 85)
                .toColourspace('srgb')
                .png()
                .toBuffer(),
            )
            .setMimeType('image/png');
      }
    }
    await doc.transform(dedup(), prune());
  }
  const file = name + '.glb';
  await io.write(resolve(output, file), doc);
  const bytes = await Bun.file(resolve(output, file)).bytes();
  built.push({ file, sha256: sha256(bytes), bytes: bytes.length });
  console.log('Prepared ' + file + ': ' + (bytes.length / 1024).toFixed(0) + ' KB');
}
await Bun.write(resolve(output, 'manifest.json'), JSON.stringify(built, null, 2) + '\n');
await import('./calibrate-avatar');
