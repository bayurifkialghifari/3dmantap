import { test, expect } from 'bun:test';
import { defaultRoom, starterTemplates } from './templates';
import { createDesign, validRoom } from './design';
import { roomSchema } from './contracts';
import { roomPlanSvg } from './room-export';
import {
  addRoomProduct,
  moveRoomItem,
  openingPose,
  placeOpening,
  removeRoomItem,
  removeRoomOpening,
  replaceRoomPoints,
  roomItemPose,
  syncRoomAttachments,
  pointInRoom,
} from './room-placement';
const door = createDesign(starterTemplates.find((t) => t.modelKind === 'door')!);
const cabinet = createDesign(starterTemplates.find((t) => t.modelKind === 'cabinet')!);
const fresh = () => structuredClone(defaultRoom);

test('mounted doors project onto vertical and diagonal walls and ignore free transforms', () => {
  let room = addRoomProduct(fresh(), door, 'door', 'leaf', 1);
  expect(room.items[0]).toMatchObject({ x: 5000, y: 2025, rotation: 90 });
  room = moveRoomItem(room, 'leaf', { x: 4800, y: 300 });
  expect(room.openings[0]).toMatchObject({ wall: 1, offset: 0 });
  expect(room.items[0]).toMatchObject({ x: 5000, y: 425, rotation: 90 });
  room.points[1] = { x: 4000, y: 0 };
  room = syncRoomAttachments(room);
  const pose = roomItemPose(room, { ...room.items[0], x: 7, y: 8, rotation: 22 });
  expect(pose.rotation).toBeCloseTo(75.9638, 3);
  expect((pose.x - 4000) * 4000 - pose.y * 1000).toBeCloseTo(0, 5);
  expect(validRoom(room)).toEqual([]);
});

test('door placement clamps to corners and finds available gaps without overlap', () => {
  const room = fresh();
  room.openings = [
    { id: 'window', kind: 'window', wall: 0, offset: 1000, width: 1800, height: 1200 },
  ];
  const opening = placeOpening(room, 850, 2100, { x: 2000, y: 0 }, 'door', 'leaf', 0);
  expect(opening.offset).toBe(2800);
  expect(placeOpening(room, 850, 2100, { x: -500, y: 0 }, 'door', 'leaf', 0).offset).toBe(0);
  expect(placeOpening(room, 850, 2100, { x: 6000, y: 0 }, 'door', 'leaf', 0).offset).toBe(4150);
  expect(() => placeOpening(room, 2500, 2100, { x: 2000, y: 0 }, 'door', 'leaf', 0)).toThrow();
});

test('wall resize and corner edits preserve mounted door links and dimensions', () => {
  let room = addRoomProduct(fresh(), door, 'door', 'leaf');
  room.openings[0].offset = 4150;
  room.points[1].x = 3000;
  room = syncRoomAttachments(room);
  expect(room.openings[0].offset).toBe(2150);
  room.openings[0].width = 1000;
  room.openings[0].height = 2200;
  room = syncRoomAttachments(room);
  expect(room.items[0].document.dimensions).toMatchObject({ width: 1000, height: 2200 });
  const pose = openingPose(room, room.openings[0])!;
  room = replaceRoomPoints(room, [room.points[0], { x: 1500, y: 0 }, ...room.points.slice(1)]);
  expect(room.openings[0].id).toBe('leaf-opening');
  expect(roomItemPose(room, room.items[0]).x).toBeCloseTo(pose.x);
  expect(validRoom(room)).toEqual([]);
});

test('duplicate and delete maintain one door per opening', () => {
  let room = addRoomProduct(fresh(), door, 'door', 'one');
  room = addRoomProduct(room, door, 'door', 'two');
  expect(validRoom(room)).toEqual([]);
  expect(room.openings[0].id).not.toBe(room.openings[1].id);
  expect(removeRoomItem(room, 'one').openings.map((o) => o.id)).toEqual(['two-opening']);
  expect(removeRoomOpening(room, 'two-opening').items.map((i) => i.id)).toEqual(['one']);
  room.items[1].openingId = room.items[0].openingId;
  expect(validRoom(room).join(' ')).toContain('Satu bukaan');
});

test('free furniture snaps inside the polygon and reference height survives exports', () => {
  let room = addRoomProduct(fresh(), cabinet, 'cabinet', 'cab');
  room = moveRoomItem(room, 'cab', { x: 1328, y: 1738 });
  expect(room.items[0]).toMatchObject({ x: 1350, y: 1750 });
  expect(moveRoomItem(room, 'cab', { x: 6000, y: 2000 })).toEqual(room);
  expect(roomSchema.parse(room).person?.height).toBe(1700);
  expect(roomPlanSvg(room)).toContain('data-person-height="1700"');
  room.person!.height = 3000;
  expect(validRoom(room).length).toBeGreaterThan(0);
});
test('new furniture has a valid center in a concave room', () => {
  const room = fresh();
  delete room.person;
  room.points = [
    { x: 0, y: 0 },
    { x: 5000, y: 0 },
    { x: 5000, y: 1000 },
    { x: 1000, y: 1000 },
    { x: 1000, y: 4000 },
    { x: 0, y: 4000 },
  ];
  const added = addRoomProduct(room, cabinet, 'cabinet', 'cab');
  expect(pointInRoom(added, added.items[0])).toBe(true);
  expect(validRoom(added)).toEqual([]);
});
