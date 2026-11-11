import * as THREE from 'three';
import {
  surfaceSvg,
  surfacesFor,
  type DesignDocument,
  type ProductTemplate,
} from '@3dmantap/shared';
import { browserArtworkResolver } from '../../lib/artwork';
import type { AssetContext } from './ProductModel';
// Bake a print projection into the original garment UVs. UVs follow both skinning and body fitting.
export async function bakeWornArtwork(
  source: THREE.Mesh,
  material: THREE.Material | THREE.Material[],
  template: ProductTemplate,
  design: DesignDocument,
  context?: AssetContext,
) {
  const uv = source.geometry.getAttribute('uv'),
    pos = source.geometry.getAttribute('position'),
    index = source.geometry.index;
  if (!uv || !index || !design.layers.length) return () => {};
  const canvas = window.document.createElement('canvas');
  canvas.width = canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;
  const mats = Array.isArray(material) ? material : [material];
  const base = mats.find((m) => m instanceof THREE.MeshStandardMaterial) as
    THREE.MeshStandardMaterial | undefined;
  if (!base) return () => {};
  if (base.map?.image) ctx.drawImage(base.map.image as CanvasImageSource, 0, 0, 2048, 2048);
  else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 2048, 2048);
  }
  const bounds = new THREE.Box3().setFromObject(source),
    colors = mats.map((m) => (m instanceof THREE.MeshStandardMaterial ? m.color.clone() : null)),
    size = bounds.getSize(new THREE.Vector3()),
    center = bounds.getCenter(new THREE.Vector3());
  const resolver = browserArtworkResolver(context);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#' + base.color.getHexString();
  ctx.fillRect(0, 0, 2048, 2048);
  ctx.globalCompositeOperation = 'source-over';
  for (const surface of surfacesFor(template, design)) {
    const layers = design.layers.filter((l) => l.surfaceId === surface.id);
    if (!layers.length) continue;
    if (surface.face !== 'front' && surface.face !== 'back') continue;
    const svg = await surfaceSvg(surface, layers, resolver, 1024),
      url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      const sign = surface.face === 'front' ? 1 : -1;
      const pw = (surface.width / design.dimensions.width) * size.x,
        ph = (surface.height / design.dimensions.height) * size.y;
      for (let i = 0; i < index.count; i += 3) {
        const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)],
          points = ids.map((id) =>
            new THREE.Vector3().fromBufferAttribute(pos, id).applyMatrix4(source.matrixWorld),
          );
        const normal = new THREE.Vector3()
          .crossVectors(points[1].clone().sub(points[0]), points[2].clone().sub(points[0]))
          .normalize();
        if (normal.z * sign < 0.6) continue;
        const src = points.map((p) => [
          (0.5 +
            ((p.x - center.x - ((surface.centerX ?? 0) / design.dimensions.width) * size.x) *
              sign) /
              pw) *
            image.width,
          (0.5 -
            (p.y - center.y + ((surface.centerY ?? 0) / design.dimensions.height) * size.y) / ph) *
            image.height,
        ]);
        const dst = ids.map((id) => [uv.getX(id) * 2048, uv.getY(id) * 2048]);
        const [a, b, c] = src,
          [u, v, w] = dst;
        const det = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (Math.abs(det) < 1e-8) continue;
        const aa = ((v[0] - u[0]) * (c[1] - a[1]) - (w[0] - u[0]) * (b[1] - a[1])) / det;
        const bb = ((v[1] - u[1]) * (c[1] - a[1]) - (w[1] - u[1]) * (b[1] - a[1])) / det;
        const cc = ((w[0] - u[0]) * (b[0] - a[0]) - (v[0] - u[0]) * (c[0] - a[0])) / det;
        const dd = ((w[1] - u[1]) * (b[0] - a[0]) - (v[1] - u[1]) * (c[0] - a[0])) / det;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(...(u as [number, number]));
        ctx.lineTo(...(v as [number, number]));
        ctx.lineTo(...(w as [number, number]));
        ctx.closePath();
        ctx.clip();
        ctx.setTransform(
          aa,
          bb,
          cc,
          dd,
          u[0] - aa * a[0] - cc * a[1],
          u[1] - bb * a[0] - dd * a[1],
        );
        ctx.drawImage(image, 0, 0);
        ctx.restore();
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  const originals = mats.map((m) => (m instanceof THREE.MeshStandardMaterial ? m.map : null));
  mats.forEach((m) => {
    if (m instanceof THREE.MeshStandardMaterial) {
      m.map = texture;
      m.color.set('#ffffff');
      m.needsUpdate = true;
    }
  });
  return () => {
    mats.forEach((m, i) => {
      if (m instanceof THREE.MeshStandardMaterial && m.map === texture) {
        m.map = originals[i];
        if (colors[i]) m.color.copy(colors[i]!);
        m.needsUpdate = true;
      }
    });
    texture.dispose();
  };
}
