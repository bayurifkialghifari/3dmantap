import {
  syncRoomAttachments,
  validRoom,
  type RoomProject,
  type ProductTemplate,
} from '@3dmantap/shared';
import { fail } from '../../lib/http';

export function prepareRoom(document: RoomProject, catalog: ProductTemplate[]): RoomProject {
  for (const item of document.items) {
    const template = catalog.find((t) => t.id === item.document.templateId);
    if (!template || template.studio !== 'interior') fail('Produk ruangan tidak tersedia.', 422);
    if (template.modelKind === 'door' && !item.openingId)
      fail('Pintu harus menempel pada dinding.', 422);
    if (template.modelKind !== 'door' && item.openingId)
      fail('Bukaan dinding hanya untuk produk pintu.', 422);
  }
  const canonical = syncRoomAttachments(document);
  const issues = validRoom(canonical);
  if (issues.length) fail(issues.join(' '), 422);
  return canonical;
}
