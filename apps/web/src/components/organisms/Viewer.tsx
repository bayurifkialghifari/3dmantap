import { Suspense, useEffect, useState, useRef, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Lightformer,
  useProgress,
} from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import {
  surfacesFor,
  surfaceSvg,
  type ProductTemplate,
  type DesignDocument,
  type RoomProject,
} from '@3dmantap/shared';
import { browserArtworkResolver } from '../../lib/artwork';
import { RotateCcw, Move3D } from 'lucide-react';
import { ProductIllustration } from '../molecules/ProductIllustration';
import { ProjectedArtwork } from '../../features/editor/ProjectedArtwork';
import { GLBProduct, GLBFurniture } from '../../features/editor/GLBProduct';
type AssetContext = { inquiry?: string; design?: string; room?: string; token?: string };
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
}: {
  template: ProductTemplate;
  document: DesignDocument;
  context?: AssetContext;
  interactive?: boolean;
  capture?: boolean;
}) {
  const [reset, setReset] = useState(0);
  const scale =
    1.8 / Math.max(document.dimensions.height / 1000, document.dimensions.width / 1000, 0.3);
  const floorY = (-document.dimensions.height / 2000) * scale;
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
              <ProductModel template={template} document={document} context={context} />
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
            enablePan={false}
            enableZoom={interactive}
            enableRotate={interactive}
            minDistance={2}
            maxDistance={8}
          />
        </Canvas>
      </CanvasBoundary>
      <ModelLoading />
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
function CutawayWall({
  children,
  position,
  rotation,
  length,
  orientation,
  exterior,
}: {
  children: ReactNode;
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  orientation: number;
  exterior: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const midpoint = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!group.current || !exterior) return;
    midpoint.set(length / 2, 0, 0).applyMatrix4(group.current.matrixWorld);
    normal.set(0, 0, -orientation).transformDirection(group.current.matrixWorld);
    direction.copy(camera.position).sub(midpoint);
    group.current.visible = normal.dot(direction) <= 0;
  });
  return (
    <group ref={group} position={position} rotation={rotation}>
      {children}
    </group>
  );
}
export function RoomScene({
  room,
  templates,
  context,
}: {
  room: RoomProject;
  templates: ProductTemplate[];
  context?: AssetContext;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    room.points.forEach((p, i) =>
      i ? s.lineTo(p.x / 1000, -p.y / 1000) : s.moveTo(p.x / 1000, -p.y / 1000),
    );
    s.closePath();
    return s;
  }, [room.points]);
  const walls = room.points.map((p, i) => ({
    id: String(i),
    x1: p.x,
    y1: p.y,
    x2: room.points[(i + 1) % room.points.length].x,
    y2: room.points[(i + 1) % room.points.length].y,
  }));
  const centerX =
    (Math.min(...room.points.map((p) => p.x)) + Math.max(...room.points.map((p) => p.x))) / 2000;
  const centerY =
    (Math.min(...room.points.map((p) => p.y)) + Math.max(...room.points.map((p) => p.y))) / 2000;
  const orientation =
    Math.sign(
      room.points.reduce((sum, p, i) => {
        const next = room.points[(i + 1) % room.points.length];
        return sum + p.x * next.y - next.x * p.y;
      }, 0),
    ) || 1;
  return (
    <Canvas shadows camera={{ position: [8, 7, 8], fov: 42 }}>
      <color attach="background" args={['#ededeb']} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 10, 6]} intensity={2} />
      <group position={[-centerX, 0, -centerY]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial color={room.floorColor} side={THREE.DoubleSide} />
        </mesh>
        {[...walls, ...room.partitions].map((w, index) => {
          const length = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
          const openings =
            index < walls.length
              ? room.openings.filter((o) => o.wall === index).sort((a, b) => a.offset - b.offset)
              : [];
          const sections: { start: number; end: number; bottom: number; top: number }[] = [];
          let cursor = 0;
          for (const o of openings) {
            if (o.offset > cursor)
              sections.push({ start: cursor, end: o.offset, bottom: 0, top: room.height });
            const bottom = o.kind === 'window' ? 900 : 0;
            if (bottom)
              sections.push({ start: o.offset, end: o.offset + o.width, bottom: 0, top: bottom });
            sections.push({
              start: o.offset,
              end: o.offset + o.width,
              bottom: Math.min(room.height, bottom + o.height),
              top: room.height,
            });
            cursor = o.offset + o.width;
          }
          if (cursor < length)
            sections.push({ start: cursor, end: length, bottom: 0, top: room.height });
          return (
            <CutawayWall
              key={w.id}
              position={[w.x1 / 1000, 0, w.y1 / 1000]}
              rotation={[0, -Math.atan2(w.y2 - w.y1, w.x2 - w.x1), 0]}
              length={length / 1000}
              orientation={orientation}
              exterior={index < walls.length}
            >
              {sections
                .filter((s) => s.top > s.bottom)
                .map((s, n) => (
                  <mesh key={n} position={[(s.start + s.end) / 2000, (s.top + s.bottom) / 2000, 0]}>
                    <boxGeometry
                      args={[(s.end - s.start) / 1000, (s.top - s.bottom) / 1000, 0.08]}
                    />
                    <meshStandardMaterial color={room.wallColor} side={THREE.DoubleSide} />
                  </mesh>
                ))}
            </CutawayWall>
          );
        })}
        {room.items.map((item) => {
          const template = templates.find((t) => t.id === item.document.templateId);
          return template ? (
            <group
              key={item.id}
              position={[item.x / 1000, 0, item.y / 1000]}
              rotation={[0, (item.rotation * Math.PI) / 180, 0]}
            >
              <ProductModel template={template} document={item.document} context={context} />
            </group>
          ) : null;
        })}
      </group>
      <OrbitControls target={[0, 0.5, 0]} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  );
}
