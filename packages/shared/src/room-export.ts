import type { RoomProject } from './contracts';
import { escapeXml } from './artwork';
import { roomItemPose } from './room-placement';
import { avatarFootprint, recipeFor } from './avatar';
export function roomPlanSvg(room: RoomProject): string {
  const minX = Math.min(...room.points.map((p) => p.x)),
    minY = Math.min(...room.points.map((p) => p.y)),
    maxX = Math.max(...room.points.map((p) => p.x)),
    maxY = Math.max(...room.points.map((p) => p.y));
  const view = [minX - 450, minY - 450, maxX - minX + 900, maxY - minY + 900];
  let content =
    '<polygon points="' +
    room.points.map((p) => p.x + ',' + p.y).join(' ') +
    '" fill="' +
    room.floorColor +
    '" fill-opacity=".25" stroke="#24533a" stroke-width="25"/>';
  room.points.forEach((p, i) => {
    const n = room.points[(i + 1) % room.points.length];
    content +=
      '<text x="' +
      (p.x + n.x) / 2 +
      '" y="' +
      ((p.y + n.y) / 2 - 80) +
      '" font-size="80" text-anchor="middle" fill="#24533a">' +
      Math.round(Math.hypot(n.x - p.x, n.y - p.y) / 10) +
      ' cm</text>';
  });
  for (const p of room.partitions)
    content +=
      '<line x1="' +
      p.x1 +
      '" y1="' +
      p.y1 +
      '" x2="' +
      p.x2 +
      '" y2="' +
      p.y2 +
      '" stroke="#63725f" stroke-width="70"/>';
  for (const o of room.openings) {
    const a = room.points[o.wall],
      b = room.points[(o.wall + 1) % room.points.length],
      length = Math.hypot(b.x - a.x, b.y - a.y),
      dx = (b.x - a.x) / length,
      dy = (b.y - a.y) / length;
    content +=
      '<line x1="' +
      (a.x + dx * o.offset) +
      '" y1="' +
      (a.y + dy * o.offset) +
      '" x2="' +
      (a.x + dx * (o.offset + o.width)) +
      '" y2="' +
      (a.y + dy * (o.offset + o.width)) +
      '" stroke="' +
      (o.kind === 'door' ? '#bf976f' : '#9fc9d4') +
      '" stroke-width="80"/>';
  }
  for (const item of room.items) {
    const pose = roomItemPose(room, item);
    const w = item.document.dimensions.width,
      d = item.document.dimensions.depth;
    content +=
      '<g transform="translate(' +
      pose.x +
      ' ' +
      pose.y +
      ') rotate(' +
      pose.rotation +
      ')"><rect x="' +
      -w / 2 +
      '" y="' +
      -d / 2 +
      '" width="' +
      w +
      '" height="' +
      d +
      '" fill="' +
      item.document.color +
      '" stroke="#63725f" stroke-width="10"/><text x="0" y="0" text-anchor="middle" font-size="70">' +
      escapeXml(item.document.name) +
      '</text></g>';
  }
  if (room.person) {
    const recipe = recipeFor(room.person, room.person.height),
      footprint = avatarFootprint(recipe),
      height = Math.round(recipe.stature * 1000);
    content +=
      '<g data-person-height="' +
      height +
      '" transform="translate(' +
      room.person.x +
      ' ' +
      room.person.y +
      ') rotate(' +
      room.person.rotation +
      ')"><ellipse rx="' +
      footprint[0] / 2 +
      '" ry="' +
      footprint[1] / 2 +
      '" fill="#6b7675"/><circle r="95" fill="#c9b7a4"/><path d="M0 180 L-40 120 L40 120 Z" fill="#eeeae3"/><text y="350" text-anchor="middle" font-size="85">Manusia ' +
      height / 10 +
      ' cm</text></g>';
  }
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="' +
    Math.round((1000 * view[3]) / view[2]) +
    '" viewBox="' +
    view.join(' ') +
    '"><rect x="' +
    view[0] +
    '" y="' +
    view[1] +
    '" width="' +
    view[2] +
    '" height="' +
    view[3] +
    '" fill="#fafaf6"/>' +
    content +
    '</svg>'
  );
}
