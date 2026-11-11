import { Suspense, useState, useCallback, useEffect, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Lightformer,
  useProgress,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  type ProductTemplate,
  type DesignDocument,
  type AvatarJoint,
  type AvatarProfile,
} from '@3dmantap/shared';
import { RotateCcw, Move3D } from 'lucide-react';
import { ProductIllustration } from '../molecules/ProductIllustration';
import { ProductModel, type AssetContext } from '../../features/editor/ProductModel';
import { HumanModel } from '../../features/editor/HumanModel';
class CanvasBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function ModelLoading() {
  const { active } = useProgress();
  return active ? (
    <span className="model-loading" role="status">
      Memuat model 3D...
    </span>
  ) : null;
}
export function Viewer({
  template,
  document,
  context,
  interactive = true,
  capture = false,
  forceWorn = false,
  joint,
  onSelectJoint,
  onAvatarChange,
}: {
  template: ProductTemplate;
  document: DesignDocument;
  context?: AssetContext;
  interactive?: boolean;
  capture?: boolean;
  forceWorn?: boolean;
  joint?: AvatarJoint | null;
  onSelectJoint?: (joint: AvatarJoint | null) => void;
  onAvatarChange?: (profile: AvatarProfile) => void;
}) {
  const [reset, setReset] = useState(0);
  const [worn, setWorn] = useState(false);
  useEffect(() => {
    if (forceWorn) setWorn(true);
  }, [forceWorn]);
  const [poseDragging, setPoseDragging] = useState(false);
  const [frame, setFrame] = useState({ height: 1.7, width: 0.7, depth: 0.4, x: 0, z: 0 });
  const onBounds = useCallback((b: THREE.Box3) => {
    const s = b.getSize(new THREE.Vector3()),
      c = b.getCenter(new THREE.Vector3());
    setFrame((previous) => {
      const next = { height: s.y, width: s.x, depth: s.z, x: c.x, z: c.z };
      return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
  }, []);
  const canTryOn =
    template.studio === 'fashion' &&
    ['shirt', 'hoodie', 'jacket', 'pants'].includes(template.modelKind) &&
    !template.glbAssetId;
  const wearing = worn && canTryOn;
  const scale =
    1.8 /
    (wearing
      ? Math.max(frame.height, frame.width, frame.depth)
      : Math.max(document.dimensions.height / 1000, document.dimensions.width / 1000, 0.3));
  const floorY = (wearing ? -frame.height / 2 : -document.dimensions.height / 2000) * scale;
  return (
    <div className={'viewer' + (capture ? ' capture-viewer' : '')}>
      <CanvasBoundary
        fallback={
          <div className="viewer-fallback">
            <ProductIllustration template={template} />
            <small>Model 3D tidak dapat dimuat. Coba muat ulang.</small>
          </div>
        }
      >
        <Canvas
          key={reset}
          shadows
          camera={{ position: [2.6, 1.65, 5.2], fov: 32 }}
          dpr={capture ? 1 : [1, 1.8]}
          gl={{
            antialias: true,
            preserveDrawingBuffer: capture,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1,
          }}
        >
          <color attach="background" args={['#ededeb']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[-3, 6, 4]} intensity={2} />
          <Suspense fallback={null}>
            <Environment resolution={128}>
              <Lightformer intensity={2} position={[0, 5, 3]} scale={[8, 6, 1]} />
              <Lightformer
                intensity={1}
                position={[-5, 1, -2]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[5, 8, 1]}
              />
              <Lightformer
                intensity={0.7}
                position={[4, 2, -4]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={[4, 4, 1]}
              />
            </Environment>
            <group position={[0, floorY, 0]} scale={scale}>
              {wearing ? (
                <group position={[-frame.x, 0, -frame.z]}>
                  <HumanModel
                    template={template}
                    document={document}
                    context={context}
                    onBounds={onBounds}
                    editing={
                      onAvatarChange && onSelectJoint
                        ? {
                            joint: joint ?? null,
                            onSelect: onSelectJoint,
                            onChange: onAvatarChange,
                            onDragging: setPoseDragging,
                          }
                        : undefined
                    }
                  />
                </group>
              ) : (
                <ProductModel template={template} document={document} context={context} />
              )}
            </group>
            <ContactShadows
              position={[0, floorY - 0.012, 0]}
              opacity={0.35}
              scale={7}
              blur={2.3}
              far={4}
              resolution={256}
            />
          </Suspense>
          <OrbitControls
            makeDefault
            enabled={!poseDragging}
            enablePan={false}
            enableZoom={interactive}
            enableRotate={interactive}
            minDistance={2}
            maxDistance={8}
          />
        </Canvas>
      </CanvasBoundary>
      <ModelLoading />
      {canTryOn && !capture && (
        <div className="try-on-toggle">
          <button onClick={() => setWorn(!worn)} aria-pressed={wearing}>
            {wearing ? 'Lihat produk saja' : 'Preview dipakai'}
          </button>
          {wearing && (
            <span>
              Manusia{' '}
              {(document.avatar?.height ?? (document.avatarRecipe?.stature ?? 1.7) * 1000) / 10} cm
            </span>
          )}
        </div>
      )}
      {!capture && (
        <div className="viewer-hint">
          <Move3D size={14} /> Putar untuk melihat detail
        </div>
      )}
      {interactive && !capture && (
        <button
          className="viewer-reset icon-button"
          aria-label="Reset kamera"
          onClick={() => setReset((n) => n + 1)}
        >
          <RotateCcw size={17} />
        </button>
      )}
    </div>
  );
}
