import { useEffect, type Dispatch, type SetStateAction } from 'react';
import {
  addRoomProduct,
  moveRoomItem,
  removeRoomItem,
  removeRoomOpening,
  syncRoomAttachments,
  replaceRoomPoints,
  roomItemPose,
  pointInRoom,
  snapRoom,
  createDesign,
  type RoomProject,
  type ProductTemplate,
  type DesignDocument,
  type RoomPoint,
  type RoomOpening,
} from '@3dmantap/shared';
export function useRoomActions(
  room: RoomProject,
  setRoom: Dispatch<SetStateAction<RoomProject>>,
  templates: ProductTemplate[],
  wall: number,
  onError: (error: unknown) => void,
) {
  const apply = (action: (current: RoomProject) => RoomProject) => {
    try {
      const next = syncRoomAttachments(action(room));
      setRoom(next);
      onError(undefined);
      return next;
    } catch (error) {
      onError(error);
      return room;
    }
  };
  useEffect(() => {
    const legacy = room.items.filter(
      (i) =>
        !i.openingId &&
        templates.some((t) => t.id === i.document.templateId && t.modelKind === 'door'),
    );
    if (!legacy.length) return;
    try {
      let next = room;
      for (const item of legacy) {
        next = addRoomProduct(removeRoomItem(next, item.id), item.document, 'door', item.id);
        next = moveRoomItem(next, item.id, item);
      }
      setRoom(next);
    } catch (error) {
      onError(error);
    }
  }, [room, templates, setRoom, onError]);
  return {
    update: (patch: Partial<RoomProject>) =>
      apply((r) =>
        patch.points && patch.points.length !== r.points.length
          ? replaceRoomPoints({ ...r, ...patch, points: r.points }, patch.points)
          : { ...r, ...patch },
      ),
    add: (template: ProductTemplate, document?: DesignDocument) => {
      const id = crypto.randomUUID();
      const next = apply((r) =>
        addRoomProduct(r, document ?? createDesign(template), template.modelKind, id, wall),
      );
      return next.items.some((i) => i.id === id) ? id : null;
    },
    move: (id: string, point: RoomPoint, preferredWall?: number) => {
      const next = apply((r) => moveRoomItem(r, id, point, preferredWall));
      const item = next.items.find((i) => i.id === id);
      return item ? roomItemPose(next, item) : { ...point, rotation: 0 };
    },
    remove: (id: string) => apply((r) => removeRoomItem(r, id)),
    removeOpening: (id: string) => apply((r) => removeRoomOpening(r, id)),
    opening: (id: string, patch: Partial<RoomOpening>) =>
      apply((r) => ({
        ...r,
        openings: r.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      })),
    duplicate: (id: string) => {
      const original = room.items.find((i) => i.id === id);
      const template = templates.find((t) => t.id === original?.document.templateId);
      if (!original || !template) return null;
      const newId = crypto.randomUUID();
      const next = apply((r) => {
        const created = addRoomProduct(
          r,
          structuredClone(original.document),
          template.modelKind,
          newId,
          original.openingId
            ? (r.openings.find((o) => o.id === original.openingId)?.wall ?? wall)
            : wall,
        );
        const moved = moveRoomItem(created, newId, { x: original.x + 250, y: original.y + 250 });
        return {
          ...moved,
          items: moved.items.map((i) =>
            i.id === newId && !i.openingId ? { ...i, rotation: original.rotation } : i,
          ),
        };
      });
      return next.items.some((i) => i.id === newId) ? newId : null;
    },
    movePerson: (point: RoomPoint) =>
      apply((r) => {
        const target = { x: snapRoom(point.x), y: snapRoom(point.y) };
        return r.person && pointInRoom(r, target)
          ? { ...r, person: { ...r.person, ...target } }
          : r;
      }),
  };
}
