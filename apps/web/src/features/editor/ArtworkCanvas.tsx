import { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva';
import { layerSvg, type ArtworkLayer, type PrintSurface } from '@3dmantap/shared';
import { assetUrl } from '../../lib/api';
import { browserArtworkResolver } from '../../lib/artwork';
function ImageLayer({ layer: l, onSelect }: { layer: ArtworkLayer; onSelect: () => void }) {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    let active = true;
    let url: string | null = null;
    const img = new Image();
    if (l.kind === 'image') {
      img.src = assetUrl(l.assetId!);
      img.onload = () => {
        if (active) setImage(img);
      };
    } else {
      void layerSvg(l, browserArtworkResolver()).then((markup) => {
        const svg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="' +
          Math.round((1024 * l.height) / l.width) +
          '" viewBox="' +
          [-l.width / 2, -l.height / 2, l.width, l.height].join(' ') +
          '">' +
          markup +
          '</svg>';
        url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        img.src = url;
        img.onload = () => {
          if (active) setImage(img);
        };
      });
    }
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [l]);
  return (
    <KonvaImage
      image={image}
      x={-l.width / 2}
      y={-l.height / 2}
      width={l.width}
      height={l.height}
      opacity={l.opacity}
      onClick={onSelect}
      onTap={onSelect}
    />
  );
}
export function ArtworkCanvas({
  surface,
  layers,
  selected,
  onSelect,
  onChange,
}: {
  surface: PrintSurface;
  layers: ArtworkLayer[];
  selected: string | null;
  onSelect: (id: string) => void;
  onChange: (id: string, change: Partial<ArtworkLayer>) => void;
}) {
  const width = Math.min(window.innerWidth - 36, 620),
    height = 510,
    scale = Math.min((width - 80) / surface.width, (height - 80) / surface.height);
  return (
    <div className="artwork-canvas">
      <Stage width={width} height={height}>
        <Layer>
          <Rect width={width} height={height} fill="#edf0e9" />
          <Group x={width / 2} y={height / 2} scaleX={scale} scaleY={scale}>
            <Rect
              x={-surface.width / 2}
              y={-surface.height / 2}
              width={surface.width}
              height={surface.height}
              fill="#ffffff"
              stroke="#b0c0b1"
              strokeWidth={1 / scale}
              dash={[5 / scale, 5 / scale]}
            />
            {layers.map((l) => (
              <Group
                key={l.id}
                x={l.x}
                y={l.y}
                rotation={l.rotation}
                draggable
                onDragEnd={(e) => onChange(l.id, { x: e.target.x(), y: e.target.y() })}
                onClick={() => onSelect(l.id)}
                onTap={() => onSelect(l.id)}
              >
                <ImageLayer layer={l} onSelect={() => onSelect(l.id)} />
                <Rect
                  x={-l.width / 2}
                  y={-l.height / 2}
                  width={l.width}
                  height={l.height}
                  stroke={selected === l.id ? '#22634b' : 'transparent'}
                  strokeWidth={2 / scale}
                />
              </Group>
            ))}
          </Group>
          <Text
            x={20}
            y={height - 24}
            text={
              surface.width / 10 +
              ' × ' +
              surface.height / 10 +
              ' cm · seret layer untuk memindahkan'
            }
            fontSize={11}
            fill="#637368"
          />
        </Layer>
      </Stage>
    </div>
  );
}
