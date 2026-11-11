import {
  Suspense,
  useRef,
  useMemo,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type ComponentRef,
} from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  roomItemPose,
  type RoomProject,
  type ProductTemplate,
  type RoomPoint,
} from '@3dmantap/shared';
import { ProductModel, type AssetContext } from '../../features/editor/ProductModel';
import { HumanModel } from '../../features/editor/HumanModel';

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
  const midpoint = useMemo(() => new THREE.Vector3(), []),
    normal = useMemo(() => new THREE.Vector3(), []),
    direction = useMemo(() => new THREE.Vector3(), []);
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
function DraggableEntity({
  children,
  pose,
  center,
  selected,
  onSelect,
  onMove,
  onDragging,
  footprint,
}: {
  children: ReactNode;
  pose: { x: number; y: number; rotation: number };
  center: [number, number];
  selected: boolean;
  onSelect?: () => void;
  onMove?: (point: RoomPoint) => void;
  onDragging: (active: boolean) => void;
  footprint: [number, number];
}) {
  const drag = useRef<{ x: number; z: number; release: () => void } | null>(null);
  const { gl } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []),
    point = useMemo(() => new THREE.Vector3(), []);
  const end = useCallback(() => {
    if (!drag.current) return;
    const current = drag.current;
    drag.current = null;
    current.release();
    onDragging(false);
    gl.domElement.style.setProperty('cursor', 'grab');
  }, [onDragging, gl]);
  useEffect(() => {
    window.addEventListener('pointerup', end);
    window.addEventListener('blur', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('blur', end);
      end();
    };
  }, [end]);
  const start = (event: ThreeEvent<PointerEvent>) => {
    if (!onMove || event.button !== 0) return;
    event.stopPropagation();
    onSelect?.();
    if (!event.ray.intersectPlane(plane, point)) return;
    const target = event.target as unknown as {
      setPointerCapture: (id: number) => void;
      releasePointerCapture: (id: number) => void;
      hasPointerCapture: (id: number) => boolean;
    };
    drag.current = {
      x: pose.x / 1000 - center[0] - point.x,
      z: pose.y / 1000 - center[1] - point.z,
      release: () => {
        if (target.hasPointerCapture(event.pointerId))
          target.releasePointerCapture(event.pointerId);
      },
    };
    target.setPointerCapture(event.pointerId);
    onDragging(true);
    gl.domElement.style.setProperty('cursor', 'grabbing');
  };
  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!drag.current || !onMove) return;
    event.stopPropagation();
    if (event.ray.intersectPlane(plane, point))
      onMove({
        x: (point.x + drag.current.x + center[0]) * 1000,
        y: (point.z + drag.current.z + center[1]) * 1000,
      });
  };
  return (
    <group
      position={[pose.x / 1000, 0, pose.y / 1000]}
      rotation={[0, (-pose.rotation * Math.PI) / 180, 0]}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onLostPointerCapture={end}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={() => {
        if (onMove) gl.domElement.style.setProperty('cursor', 'grab');
      }}
      onPointerOut={() => {
        if (!drag.current) gl.domElement.style.setProperty('cursor', 'default');
      }}
    >
      {children}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <planeGeometry args={footprint} />
          <meshBasicMaterial
            color="#e86638"
            transparent
            opacity={0.22}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
export function RoomScene({
  room,
  templates,
  context,
  selected,
  onSelect,
  onMove,
  onMovePerson,
}: {
  room: RoomProject;
  templates: ProductTemplate[];
  context?: AssetContext;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, point: RoomPoint) => void;
  onMovePerson?: (point: RoomPoint) => void;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const [dragging, setDragging] = useState(false);
  const setDrag = useCallback((active: boolean) => {
    if (controls.current) controls.current.enabled = !active;
    setDragging(active);
  }, []);
  const center: [number, number] = [
    (Math.min(...room.points.map((p) => p.x)) + Math.max(...room.points.map((p) => p.x))) / 2000,
    (Math.min(...room.points.map((p) => p.y)) + Math.max(...room.points.map((p) => p.y))) / 2000,
  ];
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    room.points.forEach((p, i) =>
      i ? s.lineTo(p.x / 1000, -p.y / 1000) : s.moveTo(p.x / 1000, -p.y / 1000),
    );
    s.closePath();
    return s;
  }, [room.points]);
  const walls = room.points.map((p, i) => ({
    id: 'wall-' + i,
    x1: p.x,
    y1: p.y,
    x2: room.points[(i + 1) % room.points.length].x,
    y2: room.points[(i + 1) % room.points.length].y,
  }));
  const orientation =
    Math.sign(
      room.points.reduce((sum, p, i) => {
        const next = room.points[(i + 1) % room.points.length];
        return sum + p.x * next.y - next.x * p.y;
      }, 0),
    ) || 1;
  return (
    <Canvas
      shadows
      camera={{ position: [8, 7, 8], fov: 42 }}
      onPointerMissed={() => onSelect?.(null)}
      onCreated={({ gl }) => gl.domElement.setAttribute('data-room-3d', 'true')}
    >
      <color attach="background" args={['#ededeb']} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 10, 6]} intensity={2} />
      <group position={[-center[0], 0, -center[1]]}>
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
        <Suspense fallback={null}>
          {room.items.map((item) => {
            const template = templates.find((t) => t.id === item.document.templateId);
            return template ? (
              <DraggableEntity
                key={item.id}
                pose={roomItemPose(room, item)}
                center={center}
                selected={selected === item.id}
                onSelect={() => onSelect?.(item.id)}
                onMove={onMove ? (point) => onMove(item.id, point) : undefined}
                onDragging={setDrag}
                footprint={[
                  item.document.dimensions.width / 1000,
                  item.document.dimensions.depth / 1000,
                ]}
              >
                <ProductModel template={template} document={item.document} context={context} />
              </DraggableEntity>
            ) : null;
          })}
          {room.person && (
            <DraggableEntity
              pose={room.person}
              center={center}
              selected={selected === 'reference-person'}
              onSelect={() => onSelect?.('reference-person')}
              onMove={onMovePerson}
              onDragging={setDrag}
              footprint={[0.5, 0.35]}
            >
              <HumanModel height={room.person.height} />
            </DraggableEntity>
          )}
        </Suspense>
      </group>
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping={false}
        enabled={!dragging}
        target={[0, 0.5, 0]}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
