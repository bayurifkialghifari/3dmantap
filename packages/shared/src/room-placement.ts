import type {
  RoomProject,
  RoomItem,
  RoomOpening,
  DesignDocument,
  ProductTemplate,
} from './contracts';
export type RoomPoint = { x: number; y: number };
export const snapRoom = (n: number) => Math.round(n / 50) * 50;
export function roomWall(room: RoomProject, index: number) {
  const a = room.points[index],
    b = room.points[(index + 1) % room.points.length];
  if (!a || !b) return null;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < 1) return null;
  return {
    a,
    b,
    length,
    dx: (b.x - a.x) / length,
    dy: (b.y - a.y) / length,
    rotation: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  };
}
export function openingPose(room: RoomProject, opening: RoomOpening) {
  const wall = roomWall(room, opening.wall);
  if (!wall) return null;
  const center = opening.offset + opening.width / 2;
  return {
    x: wall.a.x + wall.dx * center,
    y: wall.a.y + wall.dy * center,
    rotation: wall.rotation,
  };
}
export function roomItemPose(room: RoomProject, item: RoomItem) {
  const opening = room.openings.find((o) => o.id === item.openingId);
  return opening ? (openingPose(room, opening) ?? item) : item;
}
export function pointInRoom(room: RoomProject, point: RoomPoint) {
  let inside = false;
  for (let i = 0, j = room.points.length - 1; i < room.points.length; j = i++) {
    const a = room.points[j],
      b = room.points[i];
    const cross = (point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x);
    if (
      Math.abs(cross) < 0.01 &&
      point.x >= Math.min(a.x, b.x) &&
      point.x <= Math.max(a.x, b.x) &&
      point.y >= Math.min(a.y, b.y) &&
      point.y <= Math.max(a.y, b.y)
    )
      return true;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
export function roomInteriorPoint(room: RoomProject): RoomPoint {
  const minX = Math.min(...room.points.map((p) => p.x)),
    maxX = Math.max(...room.points.map((p) => p.x));
  const minY = Math.min(...room.points.map((p) => p.y)),
    maxY = Math.max(...room.points.map((p) => p.y));
  const center = { x: snapRoom((minX + maxX) / 2), y: snapRoom((minY + maxY) / 2) };
  if (pointInRoom(room, center)) return center;
  const candidates: RoomPoint[] = [];
  for (let x = 1; x < 20; x++)
    for (let y = 1; y < 20; y++) {
      const point = {
        x: snapRoom(minX + ((maxX - minX) * x) / 20),
        y: snapRoom(minY + ((maxY - minY) * y) / 20),
      };
      if (pointInRoom(room, point)) candidates.push(point);
    }
  return (
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y),
    )[0] ?? room.points[0]
  );
}
// Find the nearest available segment, respecting corners and other openings.
export function placeOpening(
  room: RoomProject,
  width: number,
  height: number,
  point: RoomPoint,
  kind: RoomOpening['kind'],
  id: string,
  preferredWall?: number,
): RoomOpening {
  const candidates: { opening: RoomOpening; distance: number }[] = [];
  room.points.forEach((_, index) => {
    if (preferredWall !== undefined && index !== preferredWall) return;
    const wall = roomWall(room, index);
    if (!wall || width > wall.length) return;
    const others = room.openings
      .filter((o) => o.wall === index && o.id !== id)
      .sort((a, b) => a.offset - b.offset);
    const gaps: { start: number; end: number }[] = [];
    let cursor = 0;
    for (const o of others) {
      if (o.offset > cursor) gaps.push({ start: cursor, end: o.offset });
      cursor = Math.max(cursor, o.offset + o.width);
    }
    if (cursor < wall.length) gaps.push({ start: cursor, end: wall.length });
    const projected = (point.x - wall.a.x) * wall.dx + (point.y - wall.a.y) * wall.dy - width / 2;
    for (const gap of gaps) {
      if (gap.end - gap.start < width) continue;
      const offset = Math.max(gap.start, Math.min(gap.end - width, snapRoom(projected)));
      const opening = { id, kind, wall: index, offset, width, height };
      const pose = openingPose(room, opening)!;
      candidates.push({ opening, distance: Math.hypot(point.x - pose.x, point.y - pose.y) });
    }
  });
  const best = candidates.sort((a, b) => a.distance - b.distance)[0];
  if (!best) throw new Error('Tidak ada ruang pada dinding untuk bukaan ini.');
  return best.opening;
}
export function syncRoomAttachments(room: RoomProject): RoomProject {
  room = {
    ...room,
    openings: room.openings.map((o) => {
      const wall = roomWall(room, o.wall);
      return wall && wall.length >= o.width
        ? { ...o, offset: Math.max(0, Math.min(o.offset, wall.length - o.width)) }
        : o;
    }),
  };
  return {
    ...room,
    items: room.items.map((item) => {
      if (!item.openingId) return item;
      const opening = room.openings.find((o) => o.id === item.openingId);
      if (!opening) return item;
      return {
        ...item,
        ...roomItemPose(room, item),
        document: {
          ...item.document,
          dimensions: { ...item.document.dimensions, width: opening.width, height: opening.height },
        },
      };
    }),
  };
}
export function addRoomProduct(
  room: RoomProject,
  document: DesignDocument,
  kind: ProductTemplate['modelKind'],
  id: string,
  wallIndex = 0,
): RoomProject {
  if (kind === 'door') {
    const wall = roomWall(room, wallIndex);
    if (!wall) throw new Error('Pilih dinding yang valid.');
    if (
      document.dimensions.width > 4000 ||
      document.dimensions.height > Math.min(3000, room.height)
    )
      throw new Error('Ukuran pintu melebihi batas dinding.');
    const opening = placeOpening(
      room,
      document.dimensions.width,
      document.dimensions.height,
      { x: (wall.a.x + wall.b.x) / 2, y: (wall.a.y + wall.b.y) / 2 },
      'door',
      id + '-opening',
      wallIndex,
    );
    return syncRoomAttachments({
      ...room,
      openings: [...room.openings, opening],
      items: [...room.items, { id, document, x: 0, y: 0, rotation: 0, openingId: opening.id }],
    });
  }
  const center = roomInteriorPoint(room);
  return {
    ...room,
    items: [
      ...room.items,
      { id, document, x: snapRoom(center.x), y: snapRoom(center.y), rotation: 0 },
    ],
  };
}
export function moveRoomItem(
  room: RoomProject,
  id: string,
  point: RoomPoint,
  wallIndex?: number,
): RoomProject {
  const item = room.items.find((i) => i.id === id);
  if (!item) return room;
  if (item.openingId) {
    const old = room.openings.find((o) => o.id === item.openingId);
    if (!old) return room;
    const opening = placeOpening(room, old.width, old.height, point, 'door', old.id, wallIndex);
    return syncRoomAttachments({
      ...room,
      openings: room.openings.map((o) => (o.id === old.id ? opening : o)),
    });
  }
  const target = { x: snapRoom(point.x), y: snapRoom(point.y) };
  if (!pointInRoom(room, target)) return room;
  return { ...room, items: room.items.map((i) => (i.id === id ? { ...i, ...target } : i)) };
}
export function removeRoomItem(room: RoomProject, id: string): RoomProject {
  const item = room.items.find((i) => i.id === id);
  return {
    ...room,
    items: room.items.filter((i) => i.id !== id),
    openings: room.openings.filter((o) => o.id !== item?.openingId),
  };
}
export function removeRoomOpening(room: RoomProject, id: string): RoomProject {
  return {
    ...room,
    openings: room.openings.filter((o) => o.id !== id),
    items: room.items.filter((i) => i.openingId !== id),
  };
}
export function replaceRoomPoints(room: RoomProject, points: RoomPoint[]): RoomProject {
  let next: RoomProject = { ...room, points, openings: [] };
  for (const old of room.openings) {
    const pose = openingPose(room, old);
    if (!pose) throw new Error('Bukaan tidak memiliki dinding yang valid.');
    const opening = placeOpening(next, old.width, old.height, pose, old.kind, old.id);
    next = { ...next, openings: [...next.openings, opening] };
  }
  return syncRoomAttachments(next);
}
export function roomAttachmentIssues(room: RoomProject): string[] {
  const issues: string[] = [];
  const occupied = new Set<string>();
  if (
    new Set(room.items.map((i) => i.id)).size !== room.items.length ||
    new Set(room.openings.map((o) => o.id)).size !== room.openings.length
  )
    issues.push('ID objek ruangan harus unik.');
  if (room.person && (!pointInRoom(room, room.person) || room.person.height > room.height))
    issues.push('Manusia pembanding harus berada di dalam ruangan.');
  for (const item of room.items) {
    if (!item.openingId) {
      if (!pointInRoom(room, item)) issues.push('Pusat furnitur harus berada di dalam ruangan.');
      continue;
    }
    const opening = room.openings.find((o) => o.id === item.openingId);
    if (!opening || opening.kind !== 'door')
      issues.push('Pintu harus terhubung dengan bukaan pintu pada dinding.');
    if (occupied.has(item.openingId)) issues.push('Satu bukaan hanya boleh memiliki satu pintu.');
    occupied.add(item.openingId);
  }
  room.openings.forEach((o, index) => {
    if (
      room.openings.some(
        (other, j) =>
          j > index &&
          other.wall === o.wall &&
          other.offset < o.offset + o.width &&
          o.offset < other.offset + other.width,
      )
    )
      issues.push('Bukaan pada dinding tidak boleh bertumpuk.');
  });
  return issues;
}
