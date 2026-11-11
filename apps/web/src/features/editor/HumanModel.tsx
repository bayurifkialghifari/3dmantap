import { useMemo, useEffect, useState, useRef } from 'react';
import { useGLTF, TransformControls } from '@react-three/drei';
import { useThree, useFrame, createPortal } from '@react-three/fiber';
import * as THREE from 'three';
import {
  modelFile,
  recipeFor,
  jointBones,
  avatarJointNames,
  setJoint,
  type AvatarJoint,
  type AvatarProfile,
  type AvatarRenderRecipe,
  type ProductTemplate,
  type DesignDocument,
} from '@3dmantap/shared';
import type { AssetContext } from './ProductModel';
import { fitAvatar } from './fit-avatar';
import { bakeWornArtwork } from './worn-artwork';
export type PoseEditing = {
  joint: AvatarJoint | null;
  onSelect: (joint: AvatarJoint | null) => void;
  onChange: (profile: AvatarProfile) => void;
  onDragging: (active: boolean) => void;
};
export function HumanModel({
  height = 1700,
  profile,
  renderRecipe,
  template,
  document,
  context,
  editing,
  onBounds,
}: {
  height?: number;
  profile?: AvatarProfile;
  renderRecipe?: AvatarRenderRecipe;
  template?: ProductTemplate;
  document?: DesignDocument;
  context?: AssetContext;
  editing?: PoseEditing;
  onBounds?: (bounds: THREE.Box3) => void;
}) {
  const body = useGLTF('/models/avatar.glb').scene,
    shirt = useGLTF('/models/tshirt.glb').scene,
    pants = useGLTF('/models/jeans.glb').scene;
  profile ??= document?.avatar;
  const selected =
    template &&
    document &&
    ['shirt', 'hoodie', 'jacket', 'pants'].includes(template.modelKind) &&
    !template.glbAssetId;
  const chosen = useGLTF(selected ? modelFile(template) : '/models/tshirt.glb').scene;
  const recipe = useMemo(
    () =>
      recipeFor(
        {
          avatar: profile ?? document?.avatar,
          avatarRecipe: renderRecipe ?? document?.avatarRecipe,
        },
        height,
      ),
    [profile, document?.avatar, document?.avatarRecipe, renderRecipe, height],
  );
  const bodyKey = JSON.stringify({ ...recipe, pose: undefined });
  const kind = selected ? template?.modelKind : undefined;
  const color = document?.color;
  const fitted = useMemo(() => {
    const scenes = [
      body,
      kind && kind !== 'pants' ? chosen : shirt,
      kind === 'pants' ? chosen : pants,
    ];
    const colors = [
      undefined,
      kind && kind !== 'pants' ? color : '#dedfd9',
      kind === 'pants' ? color : '#48555d',
    ];
    if (kind === 'jacket') {
      scenes.push(shirt);
      colors.push('#dedfd9');
    }
    return fitAvatar(
      scenes,
      JSON.parse(bodyKey) as AvatarRenderRecipe,
      colors,
      kind === 'hoodie' || kind === 'jacket',
    );
  }, [bodyKey, body, shirt, pants, chosen, kind, color]);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const artworkKey = JSON.stringify(
    document ? { ...document, avatar: undefined, avatarRecipe: undefined } : null,
  );
  const artworkDocument = useMemo(
    () => JSON.parse(artworkKey) as DesignDocument | null,
    [artworkKey],
  );
  useEffect(() => () => fitted.dispose(), [fitted]);
  useEffect(() => {
    const bounds = fitted.pose(recipe.pose);
    onBounds?.(bounds);
    gl.domElement.setAttribute('data-human-height', String(Math.round(recipe.stature * 1000)));
    gl.domElement.setAttribute('data-human-pose', recipe.pose.preset);
    gl.domElement.setAttribute('data-human-sex', recipe.morphs.gender_female ? 'female' : 'male');
    gl.domElement.setAttribute(
      'data-human-posed-height',
      String(Math.round(bounds.getSize(new THREE.Vector3()).y * 1000)),
    );
    return () => {
      for (const key of ['height', 'pose', 'sex', 'posed-height'])
        gl.domElement.removeAttribute('data-human-' + key);
    };
  }, [fitted, recipe, gl, onBounds]);
  useEffect(() => {
    if (!selected || !template || !artworkDocument) return;
    let active = true;
    const disposers: (() => void)[] = [];
    chosen.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const i = fitted.sources.indexOf(o);
      if (i < 0) return;
      void bakeWornArtwork(o, fitted.meshes[i].material, template, artworkDocument, context)
        .then((dispose) => {
          if (active) disposers.push(dispose);
          else dispose();
        })
        .catch(() => {});
    });
    return () => {
      active = false;
      disposers.forEach((d) => d());
    };
  }, [selected, fitted, chosen, template, artworkDocument, context]);
  const bone = editing?.joint
    ? fitted.bones.find((b) => b.name === jointBones[editing.joint!])
    : undefined;
  const [dragging, setDragging] = useState(false);
  const onDragging = editing?.onDragging;
  useEffect(() => () => onDragging?.(false), [onDragging]);
  const markers = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!markers.current) return;
    markers.current.children.forEach((m, i) => {
      const b = fitted.bones.find((b) => b.name === jointBones[avatarJointNames[i]]);
      if (b) m.position.copy(b.getWorldPosition(new THREE.Vector3()));
      // Markers are outside the fitted hierarchy; convert from world to the human parent.
      m.parent!.worldToLocal(m.position);
    });
  });
  return (
    <>
      <primitive object={fitted.group} />
      {editing && profile && (
        <group ref={markers}>
          {avatarJointNames.map((j) => (
            <mesh
              key={j}
              onPointerDown={(e) => {
                e.stopPropagation();
                editing.onSelect(j);
              }}
              renderOrder={10}
            >
              <sphereGeometry args={[editing.joint === j ? 0.018 : 0.011, 12, 12]} />
              <meshBasicMaterial
                color={editing.joint === j ? '#ec6534' : '#ffffff'}
                depthTest={false}
              />
            </mesh>
          ))}
        </group>
      )}
      {bone &&
        editing &&
        profile &&
        createPortal(
          <TransformControls
            object={bone}
            mode="rotate"
            space="local"
            size={0.65}
            onMouseDown={() => {
              setDragging(true);
              editing.onDragging(true);
            }}
            onObjectChange={() => {
              if (!dragging) return;
              fitted.group.updateMatrixWorld(true);
              fitted.skeleton.update();
            }}
            onMouseUp={() => {
              setDragging(false);
              editing.onDragging(false);
              const relative = fitted.rest[bone.name].clone().invert().multiply(bone.quaternion),
                e = new THREE.Euler().setFromQuaternion(relative);
              editing.onChange({
                ...profile,
                pose: setJoint(
                  profile.pose,
                  editing.joint!,
                  [e.x, e.y, e.z].map((v) => (v * 180) / Math.PI),
                ),
              });
            }}
          />,
          scene,
        )}
    </>
  );
}
