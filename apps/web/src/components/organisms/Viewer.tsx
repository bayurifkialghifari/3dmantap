import { Suspense, useMemo, useEffect, useState, useRef, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Lightformer,
  RoundedBox,
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  furniturePanels,
  surfacesFor,
  surfaceSvg,
  type ProductTemplate,
  type DesignDocument,
  type RoomProject,
} from '@3dmantap/shared';
import { assetUrl } from '../../lib/api';
import { browserArtworkResolver } from '../../lib/artwork';
import { RotateCcw, Move3D } from 'lucide-react';
import { ProductIllustration } from '../molecules/ProductIllustration';
import { ProjectedArtwork } from '../../features/editor/ProjectedArtwork';
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
        const image = new Image();
        image.src = url;
        try {
          await image.decode();
          const canvas = window.document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = Math.round((1024 * surface.height) / surface.width);
          canvas.getContext('2d')!.drawImage(image, 0, 0);
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
      created.forEach((x) => x.dispose());
    };
  }, [t, d, context]);
  const dim = d.dimensions;
  const faceDepth =
    t.studio === 'interior'
      ? dim.depth
      : t.modelKind === 'shoe'
        ? dim.depth * 0.4
        : t.modelKind === 'pants'
          ? dim.depth * 0.8
          : t.modelKind === 'bag'
            ? dim.depth * 0.5
            : t.modelKind === 'cap'
              ? dim.width
              : 144;
  return (
    <>
      {surfacesFor(t, d).map((s) => {
        if (!textures[s.id]) return null;
        let position: [number, number, number] = [
          0,
          dim.height / 2000,
          faceDepth / 2000 + (t.studio === 'interior' && (d.doors || d.drawers) ? 0.02 : 0.002),
        ];
        let rotation: [number, number, number] = [0, 0, 0];
        if (s.face === 'back') {
          position = [0, dim.height / 2000, -faceDepth / 2000 - 0.002];
          rotation = [0, Math.PI, 0];
        }
        if (s.face === 'left') {
          position = [-dim.width / 2000 - 0.002, dim.height / 2000, 0];
          rotation = [0, -Math.PI / 2, 0];
        }
        if (s.face === 'right') {
          position = [dim.width / 2000 + 0.002, dim.height / 2000, 0];
          rotation = [0, Math.PI / 2, 0];
        }
        if (s.face === 'top') {
          position = [0, dim.height / 1000 + 0.002, 0];
          rotation = [-Math.PI / 2, 0, 0];
        }
        position[0] += (s.centerX ?? 0) / 1000;
        position[1] -= (s.centerY ?? 0) / 1000;
        const targetName = s.meshName ?? (t.modelKind === 'cap' ? 'print-cap' : undefined);
        const root = rootRef.current;
        const target = targetName ? root?.getObjectByName(targetName) : undefined;
        if (root && target instanceof THREE.Mesh)
          return (
            <ProjectedArtwork
              key={s.id}
              target={target}
              root={root}
              position={position}
              rotation={rotation}
              size={[
                s.width / 1000,
                s.height / 1000,
                t.studio === 'interior' ? (s.face === 'back' ? 0.008 : 0.02) : 0.18,
              ]}
              texture={textures[s.id]}
            />
          );
        return (
          <mesh key={s.id} position={position} rotation={rotation}>
            <planeGeometry args={[s.width / 1000, s.height / 1000]} />
            <meshBasicMaterial
              map={textures[s.id]}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </>
  );
}
function ImportedModel({ id, color }: { id: string; color: string }) {
  const { scene } = useGLTF(assetUrl(id));
  const clone = useMemo(() => {
    const obj = scene.clone(true);
    const box = new THREE.Box3().setFromObject(obj),
      size = box.getSize(new THREE.Vector3()),
      center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    obj.position.y += size.y / 2;
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        child.castShadow = true;
      }
    });
    return obj;
  }, [scene, color]);
  return <primitive object={clone} />;
}
export function ProductModel({
  template: t,
  document: d,
  context,
}: {
  template: ProductTemplate;
  document: DesignDocument;
  context?: AssetContext;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const points = [
      [-0.23, 0],
      [-0.25, 0.48],
      [-0.37, 0.36],
      [-0.47, 0.48],
      [-0.28, 0.7],
      [-0.12, 0.74],
      [0, 0.7],
      [0.12, 0.74],
      [0.28, 0.7],
      [0.47, 0.48],
      [0.37, 0.36],
      [0.25, 0.48],
      [0.23, 0],
    ];
    s.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach((p) => s.lineTo(p[0], p[1]));
    s.closePath();
    return s;
  }, []);
  const width = d.dimensions.width / 1000,
    height = d.dimensions.height / 1000,
    depth = d.dimensions.depth / 1000;
  const material = (
    <meshStandardMaterial color={d.color} roughness={t.studio === 'fashion' ? 0.95 : 0.62} />
  );
  return (
    <group ref={rootRef}>
      {t.glbAssetId ? (
        <ImportedModel id={t.glbAssetId} color={d.color} />
      ) : t.studio === 'interior' ? (
        furniturePanels(t, d).map((p) => (
          <mesh
            key={p.id}
            name={p.id}
            position={p.position.map((n) => n / 1000) as [number, number, number]}
            rotation={p.rotation}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[p.width / 1000, p.height / 1000, p.thickness / 1000]} />
            {material}
          </mesh>
        ))
      ) : ['shirt', 'hoodie', 'jacket'].includes(t.modelKind) ? (
        <group scale={[width / 0.65, height / 0.76, 1]}>
          <mesh position={[0, 0, -0.06]} castShadow>
            <extrudeGeometry
              args={[
                shape,
                {
                  depth: 0.12,
                  bevelEnabled: true,
                  bevelSegments: 3,
                  steps: 1,
                  bevelSize: 0.012,
                  bevelThickness: 0.012,
                },
              ]}
            />
            {material}
          </mesh>
          <mesh position={[0, 0.706, 0.062]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.085, 0.013, 12, 36, Math.PI]} />
            <meshStandardMaterial color={d.accentColor} />
          </mesh>
          {t.modelKind === 'hoodie' && (
            <mesh position={[0, 0.73, -0.03]} scale={[1, 1.2, 1]} castShadow>
              <sphereGeometry args={[0.135, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
              {material}
            </mesh>
          )}
          {t.modelKind === 'jacket' && (
            <mesh position={[0, 0.34, 0.072]}>
              <boxGeometry args={[0.005, 0.6, 0.003]} />
              <meshStandardMaterial color={d.accentColor} />
            </mesh>
          )}
        </group>
      ) : t.modelKind === 'pants' ? (
        <>
          <RoundedBox
            args={[width, height * 0.19, depth]}
            position={[0, height * 0.89, 0]}
            radius={0.015}
            castShadow
          >
            {material}
          </RoundedBox>
          {[-1, 1].map((sign) => (
            <RoundedBox
              key={sign}
              args={[width * 0.42, height * 0.83, depth * 0.8]}
              position={[sign * width * 0.25, height * 0.415, 0]}
              radius={0.018}
              castShadow
            >
              {material}
            </RoundedBox>
          ))}
        </>
      ) : t.modelKind === 'cap' ? (
        <>
          <mesh name="print-cap" position={[0, 0.015, 0]} castShadow>
            <sphereGeometry args={[width * 0.5, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {material}
          </mesh>
          <mesh
            position={[0, 0.025, 0.11]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[1, 0.75, 1]}
            castShadow
          >
            <circleGeometry args={[width * 0.5, 36]} />
            <meshStandardMaterial color={d.color} side={THREE.DoubleSide} />
          </mesh>
        </>
      ) : t.modelKind === 'shoe' ? (
        <>
          <RoundedBox
            args={[width, 0.035, depth * 0.43]}
            position={[0, 0.02, 0]}
            radius={0.015}
            castShadow
          >
            <meshStandardMaterial color={d.accentColor} />
          </RoundedBox>
          <RoundedBox
            args={[width * 0.9, height * 0.65, depth * 0.4]}
            position={[0, height * 0.42, 0]}
            radius={0.028}
            castShadow
          >
            {material}
          </RoundedBox>
          <RoundedBox
            args={[width * 0.36, height * 0.48, depth * 0.38]}
            position={[-width * 0.26, height * 0.75, 0]}
            radius={0.022}
            castShadow
          >
            {material}
          </RoundedBox>
          {[0, 1, 2, 3].map((n) => (
            <mesh key={n} position={[-width * 0.08 + n * 0.025, height * 0.78, 0]}>
              <boxGeometry args={[0.008, 0.006, depth * 0.35]} />
              <meshStandardMaterial color={d.accentColor} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          <RoundedBox
            args={[width, height, depth * 0.5]}
            position={[0, height / 2, 0]}
            radius={0.008}
            castShadow
          >
            {material}
          </RoundedBox>
          {[-1, 1].map((sign) => (
            <mesh key={sign} position={[0, height + 0.015, sign * depth * 0.2]}>
              <torusGeometry args={[width * 0.26, 0.013, 8, 32, Math.PI]} />
              {material}
            </mesh>
          ))}
        </>
      )}
      <Artwork template={t} document={d} context={context} rootRef={rootRef} />
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
export function Viewer({
  template: t,
  document: d,
  context,
  interactive = true,
}: {
  template: ProductTemplate;
  document: DesignDocument;
  context?: AssetContext;
  interactive?: boolean;
}) {
  const [reset, setReset] = useState(0);
  const scale = 1.8 / Math.max(d.dimensions.height / 1000, d.dimensions.width / 1000, 0.3);
  const modelHeight =
    t.modelKind === 'cap' && !t.glbAssetId ? d.dimensions.width / 2 + 15 : d.dimensions.height;
  const floorY = -(modelHeight / 2000) * scale;
  return (
    <div className="viewer">
      <CanvasBoundary
        fallback={
          <div className="viewer-fallback">
            <ProductIllustration template={t} />
            <small>Preview gambar — 3D membutuhkan WebGL.</small>
          </div>
        }
      >
        <Canvas
          key={reset}
          shadows
          camera={{ position: [3, 2.2, 4], fov: 35 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#edf0e9']} />
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[4, 6, 4]}
            intensity={3}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <Suspense fallback={null}>
            <Environment resolution={128}>
              <Lightformer intensity={3} position={[0, 5, -5]} scale={[10, 10, 1]} />
              <Lightformer
                intensity={2}
                position={[-5, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[10, 10, 1]}
              />
            </Environment>
            <group position={[0, floorY, 0]} scale={scale}>
              <ProductModel template={t} document={d} context={context} />
            </group>
            <ContactShadows
              position={[0, floorY - 0.02, 0]}
              opacity={0.3}
              scale={7}
              blur={2}
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
            autoRotate={!interactive}
            autoRotateSpeed={0.8}
          />
        </Canvas>
      </CanvasBoundary>
      <div className="viewer-hint">
        <Move3D size={14} /> Geser untuk putar · scroll untuk zoom
      </div>
      {interactive && (
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
  return (
    <Canvas shadows camera={{ position: [8, 7, 8], fov: 42 }}>
      <color attach="background" args={['#e8ede6']} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 10, 6]} intensity={2} castShadow />
      <group position={[-2.5, 0, -2]}>
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
            <group
              key={w.id}
              position={[w.x1 / 1000, 0, w.y1 / 1000]}
              rotation={[0, -Math.atan2(w.y2 - w.y1, w.x2 - w.x1), 0]}
            >
              {sections
                .filter((s) => s.top > s.bottom)
                .map((s, n) => (
                  <mesh key={n} position={[(s.start + s.end) / 2000, (s.top + s.bottom) / 2000, 0]}>
                    <boxGeometry
                      args={[(s.end - s.start) / 1000, (s.top - s.bottom) / 1000, 0.08]}
                    />
                    <meshStandardMaterial
                      color={room.wallColor}
                      transparent
                      opacity={index < 2 ? 0.32 : 0.85}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ))}
            </group>
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
