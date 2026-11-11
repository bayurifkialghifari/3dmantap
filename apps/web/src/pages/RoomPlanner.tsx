import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stage, Layer, Line, Circle, Rect, Text, Group } from 'react-konva';
import type Konva from 'konva';
import {
  Box,
  Layers,
  Save,
  Plus,
  Trash2,
  Copy,
  Download,
  MousePointer2,
  Ruler,
} from 'lucide-react';
import {
  defaultRoom,
  createDesign,
  validRoom,
  roomPlanSvg,
  type RoomProject,
  type SavedDesign,
} from '@3dmantap/shared';
import { api, downloadJson } from '../lib/api';
import { useTemplates } from '../lib/hooks';
import { RoomScene } from '../components/organisms/Viewer';
import { Button, Field, Input, Select, Badge, Loading, ErrorNotice } from '../components/atoms/ui';
export function RoomPlanner() {
  const { data: templates, isPending } = useTemplates();
  const { data: library } = useQuery({
    queryKey: ['library'],
    queryFn: () => api<SavedDesign[]>('/library/designs'),
  });
  const { data: savedRooms, refetch } = useQuery({
    queryKey: ['rooms'],
    queryFn: () =>
      api<{ id: string; document: RoomProject; shareToken: string }[]>('/library/rooms'),
  });
  const [room, setRoom] = useState<RoomProject>(() => {
      try {
        return JSON.parse(localStorage.getItem('3dmantap:room') ?? 'null') ?? defaultRoom;
      } catch {
        return defaultRoom;
      }
    }),
    [mode, setMode] = useState('2d'),
    [selected, setSelected] = useState<string | null>(null),
    [selectedWall, setSelectedWall] = useState(0),
    [message, setMessage] = useState(''),
    [error, setError] = useState<unknown>(),
    [adding, setAdding] = useState(false),
    [share, setShare] = useState('');
  const [measurement, setMeasurement] = useState<{ x: number; y: number }[]>([]),
    [measuring, setMeasuring] = useState(false);
  const stage = useRef<Konva.Stage>(null);
  const params = new URLSearchParams(location.search);
  const shareContext = params.get('room')
    ? { room: params.get('room')!, token: params.get('token') ?? '' }
    : undefined;
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('room'))
      void api<{ document: RoomProject }>(
        '/library/rooms/share/' + params.get('room') + '?token=' + params.get('token'),
      )
        .then((r) => setRoom(r.document))
        .catch(setError);
  }, []);
  useEffect(() => {
    localStorage.setItem('3dmantap:room', JSON.stringify(room));
  }, [room]);
  if (isPending) return <Loading />;
  const all = templates ?? [],
    interior = all.filter((t) => t.studio === 'interior'),
    issues = validRoom(room);
  const selectedItem = room.items.find((i) => i.id === selected);
  const selectedPartition = room.partitions.find((i) => i.id === selected);
  const width = Math.min(
      window.innerWidth > 1100 ? window.innerWidth - 620 : window.innerWidth - 40,
      1000,
    ),
    height = 650;
  const minX = Math.min(...room.points.map((p) => p.x)),
    minY = Math.min(...room.points.map((p) => p.y)),
    maxX = Math.max(...room.points.map((p) => p.x)),
    maxY = Math.max(...room.points.map((p) => p.y)),
    scale = Math.min((width - 120) / (maxX - minX), (height - 150) / (maxY - minY)),
    offsetX = (width - (maxX - minX) * scale) / 2 - minX * scale,
    offsetY = (height - (maxY - minY) * scale) / 2 - minY * scale;
  const captureMeasurement = () => {
    if (!measuring) return;
    const pos = stage.current?.getPointerPosition();
    if (!pos) return;
    const point = { x: (pos.x - offsetX) / scale, y: (pos.y - offsetY) / scale };
    setMeasurement((previous) => (previous.length === 2 ? [point] : [...previous, point]));
  };
  const update = (patch: Partial<RoomProject>) => setRoom({ ...room, ...patch });
  const wallLength = Math.hypot(
    room.points[(selectedWall + 1) % room.points.length].x - room.points[selectedWall].x,
    room.points[(selectedWall + 1) % room.points.length].y - room.points[selectedWall].y,
  );
  return (
    <div className="studio-workspace room-workspace">
      <div className="workspace-toolbar">
        <div>
          <Box size={20} />
          <span className="workspace-title">
            <strong>Room Planner</strong>
            <small>
              <span className="live-dot" /> Draft ruangan tersimpan lokal
            </small>
          </span>
        </div>
        <div>
          <Button variant="secondary" onClick={() => downloadJson('room-project.json', room)}>
            <Download size={16} /> JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setMode('2d');
              setMeasuring(!measuring);
              setMeasurement([]);
            }}
          >
            <Ruler size={16} />
            {measuring ? 'Ukur aktif' : 'Ukur jarak'}
          </Button>
          <Button
            disabled={!!issues.length}
            onClick={async () => {
              try {
                const saved = await api<{ id: string; shareToken: string }>('/library/rooms', {
                  method: 'POST',
                  body: JSON.stringify(room),
                });
                setShare(
                  location.origin + '/room-planner?room=' + saved.id + '&token=' + saved.shareToken,
                );
                setMessage('Ruangan disimpan. Link berbagi siap.');
                await refetch();
              } catch (e) {
                setError(e);
              }
            }}
          >
            <Save size={16} /> Simpan ruangan
          </Button>
        </div>
      </div>
      <div className="workspace-body">
        <aside className="studio-tools">
          <div className="tool-brand">
            <Badge tone="green">ROOM PLANNER</Badge>
            <h3>Bikin ruangmu sendiri.</h3>
          </div>
          <div className="tool-content">
            <Field label="Nama ruangan">
              <Input value={room.name} onChange={(e) => update({ name: e.target.value })} />
            </Field>
            {(savedRooms?.length ?? 0) > 0 && (
              <Field label="Muat ruangan tersimpan">
                <Select
                  defaultValue=""
                  onChange={(e) => {
                    const r = savedRooms?.find((r) => r.id === e.target.value);
                    if (r) setRoom(r.document);
                  }}
                >
                  <option value="">Pilih ruangan…</option>
                  {savedRooms?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.document.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="field-grid">
              <Field label="Lebar ruang (cm)">
                <Input
                  type="number"
                  min={100}
                  value={Math.round((maxX - minX) / 10)}
                  onChange={(e) => {
                    const ratio = (Number(e.target.value) * 10) / (maxX - minX);
                    update({
                      points: room.points.map((p) => ({ ...p, x: minX + (p.x - minX) * ratio })),
                    });
                  }}
                />
              </Field>
              <Field label="Panjang ruang (cm)">
                <Input
                  type="number"
                  min={100}
                  value={Math.round((maxY - minY) / 10)}
                  onChange={(e) => {
                    const ratio = (Number(e.target.value) * 10) / (maxY - minY);
                    update({
                      points: room.points.map((p) => ({ ...p, y: minY + (p.y - minY) * ratio })),
                    });
                  }}
                />
              </Field>
            </div>
            <Field label="Tinggi dinding (cm)">
              <Input
                type="number"
                min={200}
                max={600}
                value={room.height / 10}
                onChange={(e) => update({ height: Number(e.target.value) * 10 })}
              />
            </Field>
            <p className="help-text">
              Seret titik sudut pada denah untuk membentuk ruangan. Klik dinding untuk memilih area
              bukaan.
            </p>
            <div className="artwork-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  const a = room.points[selectedWall],
                    b = room.points[(selectedWall + 1) % room.points.length];
                  const points = [...room.points];
                  points.splice(selectedWall + 1, 0, {
                    x: (a.x + b.x) / 2,
                    y: (a.y + b.y) / 2 + 400,
                  });
                  update({ points });
                }}
              >
                Tambah sudut
              </Button>
              <Button
                variant="ghost"
                disabled={room.points.length <= 3}
                onClick={() => {
                  update({
                    points: room.points.filter((_, i) => i !== selectedWall),
                    openings: [],
                  });
                  setSelectedWall(0);
                }}
              >
                <Trash2 size={15} />
              </Button>
            </div>
            <Field label="Dinding untuk bukaan">
              <Select
                value={selectedWall}
                onChange={(e) => setSelectedWall(Number(e.target.value))}
              >
                {room.points.map((_, i) => (
                  <option key={i} value={i}>
                    Dinding {i + 1}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="artwork-actions">
              <Button
                variant="secondary"
                onClick={() =>
                  update({
                    openings: [
                      ...room.openings,
                      {
                        id: crypto.randomUUID(),
                        kind: 'door',
                        wall: selectedWall,
                        offset: Math.max(0, wallLength / 2 - 450),
                        width: 900,
                        height: 2100,
                      },
                    ],
                  })
                }
              >
                + Pintu
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  update({
                    openings: [
                      ...room.openings,
                      {
                        id: crypto.randomUUID(),
                        kind: 'window',
                        wall: selectedWall,
                        offset: Math.max(0, wallLength / 2 - 600),
                        width: 1200,
                        height: 1200,
                      },
                    ],
                  })
                }
              >
                + Jendela
              </Button>
            </div>
            {room.openings
              .filter((o) => o.wall === selectedWall)
              .map((o) => (
                <div className="opening-editor" key={o.id}>
                  <strong>{o.kind === 'door' ? 'Pintu' : 'Jendela'}</strong>
                  <button
                    className="icon-button"
                    aria-label="Hapus bukaan"
                    onClick={() => update({ openings: room.openings.filter((x) => x.id !== o.id) })}
                  >
                    <Trash2 size={14} />
                  </button>
                  {(['offset', 'width', 'height'] as const).map((k, i) => (
                    <Field key={k} label={['Posisi (cm)', 'Lebar (cm)', 'Tinggi (cm)'][i]}>
                      <Input
                        type="number"
                        value={o[k] / 10}
                        onChange={(e) =>
                          update({
                            openings: room.openings.map((x) =>
                              x.id === o.id ? { ...x, [k]: Number(e.target.value) * 10 } : x,
                            ),
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>
              ))}
            <Button
              variant="secondary"
              className="full"
              onClick={() => {
                const id = crypto.randomUUID();
                update({
                  partitions: [...room.partitions, { id, x1: 1000, y1: 1000, x2: 3000, y2: 1000 }],
                });
                setSelected(id);
              }}
            >
              Tambah partisi
            </Button>
            <div className="field-grid">
              <Field label="Warna lantai">
                <Input
                  type="color"
                  value={room.floorColor}
                  onChange={(e) => update({ floorColor: e.target.value })}
                />
              </Field>
              <Field label="Warna dinding">
                <Input
                  type="color"
                  value={room.wallColor}
                  onChange={(e) => update({ wallColor: e.target.value })}
                />
              </Field>
            </div>
            <Button variant="ghost" onClick={() => setRoom(defaultRoom)}>
              Reset ruangan
            </Button>
          </div>
        </aside>
        <section className="studio-canvas">
          <div className="canvas-mode">
            <button className={mode === '2d' ? 'active' : ''} onClick={() => setMode('2d')}>
              <Layers size={16} /> Denah 2D
            </button>
            <button className={mode === '3d' ? 'active' : ''} onClick={() => setMode('3d')}>
              <Box size={16} /> Ruang 3D
            </button>
          </div>
          {mode === '3d' ? (
            <div className="room-3d">
              <RoomScene room={room} templates={all} context={shareContext} />
            </div>
          ) : (
            <div className="room-2d">
              <Stage
                ref={stage}
                width={width}
                height={height}
                onMouseDown={captureMeasurement}
                onTouchStart={captureMeasurement}
              >
                <Layer>
                  <Rect width={width} height={height} fill="#edf0e9" />
                  <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
                    <Line
                      points={room.points.flatMap((p) => [p.x, p.y])}
                      closed
                      fill={room.floorColor}
                      opacity={0.35}
                    />
                    {room.points.map((p, i) => {
                      const n = room.points[(i + 1) % room.points.length];
                      return (
                        <Group key={i}>
                          <Line
                            points={[p.x, p.y, n.x, n.y]}
                            stroke={selectedWall === i ? '#24654b' : '#627567'}
                            strokeWidth={selectedWall === i ? 8 / scale : 5 / scale}
                            onClick={() => setSelectedWall(i)}
                          />
                          <Circle
                            x={p.x}
                            y={p.y}
                            radius={6 / scale}
                            fill="#fff"
                            stroke="#24654b"
                            strokeWidth={2 / scale}
                            draggable
                            onDragEnd={(e) =>
                              update({
                                points: room.points.map((a, n) =>
                                  n === i
                                    ? {
                                        x: Math.round(e.target.x() / 50) * 50,
                                        y: Math.round(e.target.y() / 50) * 50,
                                      }
                                    : a,
                                ),
                              })
                            }
                          />
                          <Text
                            x={(p.x + n.x) / 2}
                            y={(p.y + n.y) / 2 - 24 / scale}
                            text={Math.round(Math.hypot(n.x - p.x, n.y - p.y) / 10) + ' cm'}
                            fontSize={11 / scale}
                            fill="#354c3b"
                          />
                        </Group>
                      );
                    })}
                    {room.partitions.map((p) => (
                      <Line
                        key={p.id}
                        points={[p.x1, p.y1, p.x2, p.y2]}
                        stroke={selected === p.id ? '#3c875f' : '#666e65'}
                        strokeWidth={8 / scale}
                        onClick={() => setSelected(p.id)}
                      />
                    ))}
                    {room.openings.map((o) => {
                      const a = room.points[o.wall],
                        b = room.points[(o.wall + 1) % room.points.length],
                        length = Math.hypot(b.x - a.x, b.y - a.y),
                        dx = (b.x - a.x) / length,
                        dy = (b.y - a.y) / length;
                      return (
                        <Line
                          key={o.id}
                          points={[
                            a.x + dx * o.offset,
                            a.y + dy * o.offset,
                            a.x + dx * (o.offset + o.width),
                            a.y + dy * (o.offset + o.width),
                          ]}
                          stroke={o.kind === 'door' ? '#bd8b5d' : '#a6c9d6'}
                          strokeWidth={10 / scale}
                        />
                      );
                    })}
                    {room.items.map((item) => {
                      const w = item.document.dimensions.width,
                        dep = item.document.dimensions.depth;
                      return (
                        <Group
                          key={item.id}
                          x={item.x}
                          y={item.y}
                          rotation={item.rotation}
                          draggable
                          onDragEnd={(e) =>
                            update({
                              items: room.items.map((x) =>
                                x.id === item.id
                                  ? {
                                      ...x,
                                      x: Math.round(e.target.x() / 50) * 50,
                                      y: Math.round(e.target.y() / 50) * 50,
                                    }
                                  : x,
                              ),
                            })
                          }
                          onClick={() => setSelected(item.id)}
                          onTap={() => setSelected(item.id)}
                        >
                          <Rect
                            x={-w / 2}
                            y={-dep / 2}
                            width={w}
                            height={dep}
                            fill={item.document.color}
                            stroke={selected === item.id ? '#24654b' : '#776751'}
                            strokeWidth={selected === item.id ? 3 / scale : 1 / scale}
                          />
                          <Text
                            x={-w / 2 + 30}
                            y={-dep / 2 + 30}
                            width={w - 60}
                            text={item.document.name}
                            fontSize={12 / scale}
                            fill="#20372b"
                          />
                        </Group>
                      );
                    })}
                    {measurement.length === 2 && (
                      <Group>
                        <Line
                          points={measurement.flatMap((p) => [p.x, p.y])}
                          stroke="#9d6845"
                          strokeWidth={2 / scale}
                          dash={[6 / scale, 4 / scale]}
                        />
                        <Text
                          x={(measurement[0].x + measurement[1].x) / 2}
                          y={(measurement[0].y + measurement[1].y) / 2}
                          fontSize={12 / scale}
                          fill="#9d6845"
                          text={
                            (
                              Math.hypot(
                                measurement[0].x - measurement[1].x,
                                measurement[0].y - measurement[1].y,
                              ) / 10
                            ).toFixed(1) + ' cm'
                          }
                        />
                      </Group>
                    )}
                  </Group>
                  <Text
                    x={20}
                    y={height - 30}
                    text="Snap 5 cm · seret furnitur / sudut · klik untuk memilih"
                    fontSize={11}
                    fill="#667b6a"
                  />
                </Layer>
              </Stage>
            </div>
          )}
          <div className="canvas-footer">
            <span>{room.name}</span>
            <span>
              {room.items.length} furnitur · {room.points.length} dinding
            </span>
          </div>
        </section>
        <aside className="studio-summary">
          <span className="eyebrow">ISI RUANGANMU</span>
          <h3>Setiap benda, ada tempatnya.</h3>
          <Button variant="secondary" className="full" onClick={() => setAdding(!adding)}>
            <Plus size={16} /> Tambah furnitur
          </Button>
          {adding && (
            <div className="room-product-list">
              {interior.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    const id = crypto.randomUUID();
                    update({
                      items: [
                        ...room.items,
                        {
                          id,
                          document: createDesign(t),
                          x: (maxX + minX) / 2,
                          y: (maxY + minY) / 2,
                          rotation: 0,
                        },
                      ],
                    });
                    setSelected(id);
                    setAdding(false);
                  }}
                >
                  {t.name}
                  <Plus size={14} />
                </button>
              ))}
              {library
                ?.filter((x) => interior.some((t) => t.id === x.document.templateId))
                .map((x) => (
                  <button
                    key={x.id}
                    onClick={() => {
                      const id = crypto.randomUUID();
                      update({
                        items: [
                          ...room.items,
                          { id, document: x.document, x: 2500, y: 2000, rotation: 0 },
                        ],
                      });
                      setSelected(id);
                      setAdding(false);
                    }}
                  >
                    <Save size={14} />
                    {x.name}
                  </button>
                ))}
            </div>
          )}
          {selectedItem ? (
            <>
              <h4>{selectedItem.document.name}</h4>
              {(['x', 'y', 'rotation'] as const).map((k) => (
                <Field
                  key={k}
                  label={{ x: 'Posisi X (cm)', y: 'Posisi Y (cm)', rotation: 'Rotasi (°)' }[k]}
                >
                  <Input
                    type="number"
                    value={k === 'rotation' ? selectedItem[k] : selectedItem[k] / 10}
                    onChange={(e) =>
                      update({
                        items: room.items.map((x) =>
                          x.id === selected
                            ? { ...x, [k]: Number(e.target.value) * (k === 'rotation' ? 1 : 10) }
                            : x,
                        ),
                      })
                    }
                  />
                </Field>
              ))}
              <Button
                variant="ghost"
                onClick={() =>
                  update({
                    items: [
                      ...room.items,
                      {
                        ...selectedItem,
                        id: crypto.randomUUID(),
                        x: selectedItem.x + 200,
                        y: selectedItem.y + 200,
                      },
                    ],
                  })
                }
              >
                <Copy size={15} /> Duplikat
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  update({ items: room.items.filter((x) => x.id !== selected) });
                  setSelected(null);
                }}
              >
                <Trash2 size={15} /> Hapus
              </Button>
            </>
          ) : selectedPartition ? (
            <>
              <h4>Partisi</h4>
              {(['x1', 'y1', 'x2', 'y2'] as const).map((k) => (
                <Field key={k} label={k + ' (cm)'}>
                  <Input
                    type="number"
                    value={selectedPartition[k] / 10}
                    onChange={(e) =>
                      update({
                        partitions: room.partitions.map((p) =>
                          p.id === selected ? { ...p, [k]: Number(e.target.value) * 10 } : p,
                        ),
                      })
                    }
                  />
                </Field>
              ))}
              <Button
                variant="ghost"
                onClick={() =>
                  update({ partitions: room.partitions.filter((p) => p.id !== selected) })
                }
              >
                <Trash2 size={15} /> Hapus partisi
              </Button>
            </>
          ) : (
            <div className="empty small">
              <MousePointer2 size={25} />
              <p>Pilih furnitur atau partisi untuk mengatur posisinya.</p>
            </div>
          )}
          <ErrorNotice error={error} />
          {issues.map((i) => (
            <div className="notice error" key={i}>
              {i}
            </div>
          ))}
          {message && <div className="notice">{message}</div>}
          {share && (
            <Button
              variant="secondary"
              className="full"
              onClick={async () => {
                await navigator.clipboard.writeText(share);
                setMessage('Link ruangan disalin.');
              }}
            >
              Salin link berbagi
            </Button>
          )}
          <Button
            variant="ghost"
            className="full"
            disabled={mode !== '2d'}
            onClick={() => {
              const a = document.createElement('a');
              a.download = 'room-plan.png';
              a.href = stage.current?.toDataURL({ pixelRatio: 2 }) ?? '';
              a.click();
            }}
          >
            <Download size={15} /> Ekspor gambar denah
          </Button>
          <Button
            variant="ghost"
            className="full"
            disabled={!!issues.length}
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([roomPlanSvg(room)], { type: 'image/svg+xml' }),
              );
              const a = document.createElement('a');
              a.download = 'room-plan.svg';
              a.href = url;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={15} /> Ekspor denah SVG
          </Button>
        </aside>
      </div>
    </div>
  );
}
