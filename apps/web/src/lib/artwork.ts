import { parse, type Font } from 'opentype.js';
import { artworkFonts, type ArtworkResolver } from '@3dmantap/shared';
import { assetUrl } from './api';
const fonts = new Map<string, Promise<Font>>();
export function browserArtworkResolver(context?: {
  inquiry?: string;
  design?: string;
  room?: string;
  token?: string;
}): ArtworkResolver {
  return {
    font(name) {
      const file = artworkFonts[name];
      if (!fonts.has(file))
        fonts.set(
          file,
          fetch('/fonts/artwork/' + file + '.ttf')
            .then((r) => r.arrayBuffer())
            .then((b) => parse(b)),
        );
      return fonts.get(file)!;
    },
    async image(id) {
      const response = await fetch(assetUrl(id, context));
      if (!response.ok) throw new Error('Artwork tidak tersedia');
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    },
  };
}
