import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { modelFile, type ProductTemplate, type DesignDocument } from '@3dmantap/shared';
import { ProductModel, type AssetContext } from './ProductModel';

function useNeutralModel(file: string, color?: string) {
  const { scene } = useGLTF('/models/' + file + '.glb');
  const object = useMemo(() => {
    const copy = cloneSkeleton(scene);
    copy.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        const material = (m: THREE.Material) => {
          const result = m.clone();
          if (color && result instanceof THREE.MeshStandardMaterial) {
            result.color.set(color);
            result.roughness = Math.max(result.roughness, 0.8);
            result.normalScale.multiplyScalar(0.25);
          }
          return result;
        };
        child.material = Array.isArray(child.material)
          ? child.material.map(material)
          : material(child.material);
      }
    });
    return copy;
  }, [scene, color]);
  useEffect(
    () => () =>
      object.traverse((child) => {
        if (child instanceof THREE.Mesh)
          (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) =>
            m.dispose(),
          );
        if (child instanceof THREE.SkinnedMesh) child.skeleton.dispose();
      }),
    [object],
  );
  return object;
}
function WornProduct({
  template,
  document,
  context,
}: {
  template: ProductTemplate;
  document: DesignDocument;
  context?: AssetContext;
}) {
  const { scene } = useGLTF(modelFile(template));
  const { size, center, min } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    return {
      size: box.getSize(new THREE.Vector3()),
      center: box.getCenter(new THREE.Vector3()),
      min: box.min.y,
    };
  }, [scene]);
  return (
    <group
      position={[center.x, min, center.z]}
      scale={[
        size.x / (document.dimensions.width / 1000),
        size.y / (document.dimensions.height / 1000),
        size.z / (document.dimensions.depth / 1000),
      ]}
    >
      <ProductModel template={template} document={document} context={context} />
    </group>
  );
}
export function HumanModel({
  height = 1700,
  template,
  document,
  context,
}: {
  height?: number;
  template?: ProductTemplate;
  document?: DesignDocument;
  context?: AssetContext;
}) {
  const body = useNeutralModel('avatar');
  const shirt = useNeutralModel('tshirt', '#dedfd9');
  const pants = useNeutralModel('jeans', '#48555d');
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.domElement.setAttribute('data-human-height', String(height));
    return () => gl.domElement.removeAttribute('data-human-height');
  }, [gl, height]);
  const { factor, center, min } = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(body);
    const size = bounds.getSize(new THREE.Vector3());
    return {
      factor: height / 1000 / size.y,
      center: bounds.getCenter(new THREE.Vector3()),
      min: bounds.min.y,
    };
  }, [body, height]);
  const selected =
    template &&
    document &&
    ['shirt', 'hoodie', 'jacket', 'pants'].includes(template.modelKind) &&
    !template.glbAssetId;
  return (
    <group scale={factor}>
      <group position={[-center.x, -min, -center.z]}>
        <primitive object={body} />
        {selected && template.modelKind === 'jacket' && <primitive object={shirt} />}
        {selected && template.modelKind !== 'pants' ? (
          <WornProduct template={template} document={document} context={context} />
        ) : (
          <primitive object={shirt} />
        )}
        {selected && template.modelKind === 'pants' ? (
          <WornProduct template={template} document={document} context={context} />
        ) : (
          <primitive object={pants} />
        )}
      </group>
    </group>
  );
}
