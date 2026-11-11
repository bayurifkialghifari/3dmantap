import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { createDesign, type DesignDocument, type ProductTemplate } from '@3dmantap/shared';
export type EditorState = {
  document: DesignDocument;
  past: DesignDocument[];
  future: DesignDocument[];
  setDocument: (d: DesignDocument) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
};
export function makeEditorStore(t: ProductTemplate) {
  return createStore<EditorState>()(
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
      }),
      {
        name: '3dmantap:draft:' + t.id,
        partialize: (s) => ({ document: s.document, past: [], future: [] }),
      },
    ),
  );
}
