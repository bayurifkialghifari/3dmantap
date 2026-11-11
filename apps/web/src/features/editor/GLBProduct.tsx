import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {
  furniturePanels,
  modelFile,
  productModels,
  productModelScale,
  type ProductTemplate,
  type DesignDocument,
} from '@3dmantap/shared';
import { assetUrl } from '../../lib/api';
function recolor(material: THREE.Material, template: ProductTemplate, document: DesignDocument) {
  const copy = material.clone();
  if (copy instanceof THREE.MeshStandardMaterial) {
    if (template.studio === 'fashion') {
      // Keep sneaker sole/laces and original scan details; color the fabric body.
      if (template.modelKind === 'bag') {
        if (copy.name === 'Blue') copy.color.set(document.color);
        if (copy.name === 'Black') copy.color.set(document.accentColor);
      } else if (template.modelKind === 'shoe') {
        if (document.color !== template.color) copy.color.set(document.color);
      } else copy.color.set(document.color);
      copy.roughness = Math.max(copy.roughness, 0.58);
      copy.normalScale.multiplyScalar(0.25);
    } else {
      copy.color.set(document.color === template.color ? '#ffffff' : document.color);
      if (document.material === 'walnut') copy.color.set('#94684b');
      if (document.material === 'graphite') copy.color.set('#626266');
      if (document.material === 'white') copy.color.set('#f2f0ed');
    }
  }
  return copy;
}
export function GLBProduct({
  template,
  document,
}: {
  template: ProductTemplate;
  document: DesignDocument;
}) {
  const asset = productModels[template.modelKind];
  const url = template.glbAssetId ? assetUrl(template.glbAssetId) : modelFile(template);
  const { scene } = useGLTF(url);
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.domElement.setAttribute('data-model-loaded', template.modelKind);
    return () => {
      gl.domElement.removeAttribute('data-model-loaded');
    };
  }, [gl, template.modelKind]);
  const object = useMemo(() => {
    const source = cloneSkeleton(scene);
    const [rotationX, rotationY, rotationZ] = template.glbAssetId ? [0, 0, 0] : asset.rotation;
    source.rotation.set(rotationX, rotationY, rotationZ);
    source.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());
    if ([size.x, size.y, size.z].some((n) => !Number.isFinite(n) || n <= 0))
      throw new Error('Dimensi model GLB tidak valid.');
    const center = box.getCenter(new THREE.Vector3());
    const group = new THREE.Group();
    group.scale.set(...productModelScale(template, document.dimensions, size));
    source.position.set(-center.x, -box.min.y, -center.z);
    source.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = child.receiveShadow = true;
        child.userData.printTarget = true;
        child.material = Array.isArray(child.material)
          ? child.material.map((m) => recolor(m, template, document))
          : recolor(child.material, template, document);
      }
    });
    group.add(source);
    return group;
  }, [scene, template, document, asset]);
  useEffect(
    () => () => {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh)
          (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) =>
            m.dispose(),
          );
        if (child instanceof THREE.SkinnedMesh) child.skeleton.dispose();
      });
    },
    [object],
  );
  return <primitive object={object} />;
}
export function GLBFurniture({
  template,
  document,
}: {
  template: ProductTemplate;
  document: DesignDocument;
}) {
  const { scene } = useGLTF('/models/furniture-parts.glb');
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.domElement.setAttribute('data-model-loaded', template.modelKind);
    return () => {
      gl.domElement.removeAttribute('data-model-loaded');
    };
  }, [gl, template.modelKind]);
  const parts = useMemo(() => {
    const result: Record<
      string,
      { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }
    > = {};
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh)
        result[child.name] = {
          geometry: child.geometry,
          material: Array.isArray(child.material)
            ? child.material.map((m) => recolor(m, template, document))
            : recolor(child.material, template, document),
        };
    });
    return result;
  }, [scene, template, document]);
  useEffect(
    () => () => {
      Object.values(parts).forEach((part) =>
        (Array.isArray(part.material) ? part.material : [part.material]).forEach((m) =>
          m.dispose(),
        ),
      );
    },
    [parts],
  );
  return (
    <>
      {furniturePanels(template, document).map((panel) => {
        const source =
          parts[template.modelKind === 'door' || panel.id.startsWith('door-') ? 'door' : 'board'];
        if (!source) return null;
        return (
          <mesh
            key={panel.id}
            name={panel.id}
            geometry={source.geometry}
            dispose={null}
            material={source.material}
            position={panel.position.map((n) => n / 1000) as [number, number, number]}
            rotation={panel.rotation}
            scale={[panel.width / 1000, panel.height / 1000, panel.thickness / 1000]}
            castShadow
            receiveShadow
            userData={{ printTarget: true }}
          />
        );
      })}
    </>
  );
}
