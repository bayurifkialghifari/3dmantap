import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { createDesign, type DesignDocument, type ProductTemplate } from '@3dmantap/shared';
import { avatarProfileSchema } from '@3dmantap/shared';
export type EditorState = {
  document: DesignDocument;
  past: DesignDocument[];
  future: DesignDocument[];
  setDocument: (d: DesignDocument) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  beginGesture: () => void;
  previewDocument: (d: DesignDocument) => void;
  endGesture: () => void;
};
export function makeEditorStore(t: ProductTemplate) {
  let gesture: DesignDocument | undefined;
  const store = createStore<EditorState>()(
    persist(
      (set, get) => ({
        document: createDesign(t),
        past: [],
        future: [],
        setDocument: (d) =>
          set((s) => ({ document: d, past: [...s.past, s.document].slice(-40), future: [] })),
        undo: () => {
          const s = get();
          if (s.past.length)
            set({
              document: s.past.at(-1)!,
              past: s.past.slice(0, -1),
              future: [s.document, ...s.future],
            });
        },
        redo: () => {
          const s = get();
          if (s.future.length)
            set({
              document: s.future[0],
              past: [...s.past, s.document],
              future: s.future.slice(1),
            });
        },
        reset: () => get().setDocument(createDesign(t)),
        beginGesture: () => {
          gesture ??= get().document;
        },
        previewDocument: (document) => set({ document }),
        endGesture: () => {
          const start = gesture;
          gesture = undefined;
          if (start && JSON.stringify(start) !== JSON.stringify(get().document))
            set((s) => ({ past: [...s.past, start].slice(-40), future: [] }));
        },
      }),
      {
        name: '3dmantap:draft:' + t.id,
        partialize: (s) => ({ document: s.document, past: [], future: [] }),
      },
    ),
  );
  const transfer = sessionStorage.getItem('3dmantap:avatar:' + t.id);
  if (transfer) {
    sessionStorage.removeItem('3dmantap:avatar:' + t.id);
    try {
      const avatar = avatarProfileSchema.parse(JSON.parse(transfer));
      store
        .getState()
        .setDocument({ ...store.getState().document, avatar, avatarRecipe: undefined });
    } catch {
      /* Ignore a stale preview selection. */
    }
  }
  return store;
}
