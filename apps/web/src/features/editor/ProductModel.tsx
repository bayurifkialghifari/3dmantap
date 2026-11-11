import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  surfacesFor,
  surfaceSvg,
  type ProductTemplate,
  type DesignDocument,
} from '@3dmantap/shared';
import { browserArtworkResolver } from '../../lib/artwork';
import { ProjectedArtwork } from './ProjectedArtwork';
import { GLBProduct, GLBFurniture } from './GLBProduct';
export type AssetContext = { inquiry?: string; design?: string; room?: string; token?: string };
function Artwork({
  template: t,
  document: d,
  context,
  rootRef,
}: {
  template: ProductTemplate;
  document: DesignDocument;
  context?: AssetContext;
  rootRef: React.RefObject<THREE.Group | null>;
}) {
  const [textures, setTextures] = useState<Record<string, THREE.CanvasTexture>>({});
  useEffect(() => {
    let active = true;
    const created: THREE.CanvasTexture[] = [];
    const resolver = browserArtworkResolver(context);
    void Promise.all(
      surfacesFor(t, d).map(async (surface) => {
        const layers = d.layers.filter((l) => l.surfaceId === surface.id);
        if (!layers.length) return null;
        const svg = await surfaceSvg(surface, layers, resolver, 1024);
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        const picture = new Image();
        picture.src = url;
        try {
          await picture.decode();
          const canvas = window.document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = Math.round((1024 * surface.height) / surface.width);
          canvas.getContext('2d')!.drawImage(picture, 0, 0);
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          created.push(texture);
          return [surface.id, texture] as const;
        } finally {
          URL.revokeObjectURL(url);
        }
      }),
    )
      .then((entries) => {
        if (active) setTextures(Object.fromEntries(entries.filter((e) => e !== null)));
      })
      .catch(() => {
        if (active) setTextures({});
      });
    return () => {
      active = false;
      created.forEach((t) => t.dispose());
    };
  }, [t, d, context]);
  const dim = d.dimensions;
  const faceDepth =
    t.modelKind === 'cap' ? dim.width : t.modelKind === 'shoe' ? dim.depth * 0.4 : dim.depth;
  const root = rootRef.current;
  const targets: THREE.Mesh[] = [];
  root?.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData.printTarget) targets.push(child);
  });
  return (
    <>
      {surfacesFor(t, d).map((surface) => {
        const texture = textures[surface.id];
        if (!texture || !root) return null;
        let position: [number, number, number] = [
          0,
          dim.height / 2000,
          faceDepth / 2000 + (t.studio === 'interior' && (d.doors || d.drawers) ? 0.018 : 0.001),
        ];
        let rotation: [number, number, number] = [0, 0, 0];
        if (surface.face === 'back') {
          position = [0, dim.height / 2000, -faceDepth / 2000 - 0.001];
          rotation = [0, Math.PI, 0];
        }
        if (surface.face === 'left') {
          position = [-dim.width / 2000 - 0.001, dim.height / 2000, 0];
          rotation = [0, -Math.PI / 2, 0];
        }
        if (surface.face === 'right') {
          position = [dim.width / 2000 + 0.001, dim.height / 2000, 0];
          rotation = [0, Math.PI / 2, 0];
        }
        if (surface.face === 'top') {
          position = [0, dim.height / 1000 + 0.001, 0];
          rotation = [-Math.PI / 2, 0, 0];
        }
        position[0] += (surface.centerX ?? 0) / 1000;
        position[1] -= (surface.centerY ?? 0) / 1000;
        const named = surface.meshName
          ? targets.filter((mesh) => mesh.name === surface.meshName)
          : targets;
        const selected = named.length ? named : targets;
        return selected.map((target, index) => (
          <ProjectedArtwork
            key={surface.id + '-' + index}
            target={target}
            root={root}
            position={position}
            rotation={rotation}
            size={[
              surface.width / 1000,
              surface.height / 1000,
              t.studio === 'interior' ? 0.045 : t.modelKind === 'cap' ? 0.18 : 0.12,
            ]}
            texture={texture}
          />
        ));
      })}
    </>
  );
}
export function ProductModel({
  template,
  document,
  context,
}: {
  template: ProductTemplate;
  document: DesignDocument;
  context?: AssetContext;
}) {
  const rootRef = useRef<THREE.Group>(null);
  return (
    <group ref={rootRef}>
      {template.studio === 'interior' && !template.glbAssetId ? (
        <GLBFurniture template={template} document={document} />
      ) : (
        <GLBProduct template={template} document={document} />
      )}
      <Artwork template={template} document={document} context={context} rootRef={rootRef} />
    </group>
  );
}
