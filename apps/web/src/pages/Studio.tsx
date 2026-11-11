import { useMemo, useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useStore } from 'zustand';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  Send,
  Type,
  Upload,
  Trash2,
  Copy,
  Box,
  Layers,
  Palette,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Check,
  RotateCcw,
  UserRound,
} from 'lucide-react';
import {
  priceDesign,
  rupiah,
  surfacesFor,
  validateDesign,
  furniturePanels,
  type ProductTemplate,
  type DesignDocument,
  type ArtworkLayer,
  defaultAvatar,
  type AvatarJoint,
} from '@3dmantap/shared';
import { useTemplates } from '../lib/hooks';
import { api, upload, downloadJson } from '../lib/api';
import { Viewer } from '../components/organisms/Viewer';
import { Button, Field, Input, Select, Badge, Loading, ErrorNotice } from '../components/atoms/ui';
import { makeEditorStore } from '../features/editor/store';
import { ArtworkCanvas } from '../features/editor/ArtworkCanvas';
import { SubmitDialog } from '../features/editor/SubmitDialog';
import { AvatarControls } from '../components/molecules/AvatarControls';
export function Studio() {
  const { id } = useParams({ strict: false });
  const { data: templates, isPending, error } = useTemplates();
  if (isPending) return <Loading />;
  const t = templates?.find((t) => t.id === id);
  return t ? (
    <Editor key={t.id} template={t} />
  ) : (
    <ErrorNotice error={error ?? 'Template tidak ditemukan'} />
  );
}
function Editor({ template: t }: { template: ProductTemplate }) {
  const store = useMemo(() => makeEditorStore(t), [t]),
    s = useStore(store),
    d = s.document;
  const [tab, setTab] = useState('produk'),
    [mode, setMode] = useState('3d'),
    [surfaceId, setSurfaceId] = useState(t.surfaces[0].id),
    [selected, setSelected] = useState<string | null>(null),
    [submit, setSubmit] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false);
  const surfaces = surfacesFor(t, d),
    surface = surfaces.find((s) => s.id === surfaceId) ?? surfaces[0];
  const layer = d.layers.find((l) => l.id === selected),
    price = priceDesign(t, d),
    issues = validateDesign(t, d);
  const update = (patch: Partial<DesignDocument>) => s.setDocument({ ...d, ...patch });
  const canTryOn = ['shirt', 'hoodie', 'jacket', 'pants'].includes(t.modelKind) && !t.glbAssetId;
  const [poseJoint, setPoseJoint] = useState<AvatarJoint | null>(null);
  const [poseMode, setPoseMode] = useState(false);
  const changeLayer = (id: string, patch: Partial<ArtworkLayer>) =>
    update({ layers: d.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const addText = () => {
    const l: ArtworkLayer = {
      id: crypto.randomUUID(),
      kind: 'text',
      surfaceId: surface.id,
      text: 'YOUR STORY',
      font: 'sans',
      color: '#183f35',
      x: 0,
      y: 0,
      width: Math.min(170, surface.width * 0.7),
      height: Math.min(32, surface.height * 0.5),
      rotation: 0,
      opacity: 1,
    };
    update({ layers: [...d.layers, l] });
    setSelected(l.id);
    setTab('artwork');
  };
  return (
    <div className="studio-workspace">
      <div className="workspace-toolbar">
        <div>
          <Link
            to="/product/$id"
            params={{ id: t.id }}
            className="icon-button"
            aria-label="Kembali ke produk"
          >
            <ArrowLeft size={18} />
          </Link>
          <span className="workspace-title">
            <strong>{d.name}</strong>
            <small>
              <span className="live-dot" /> Draft tersimpan di perangkat
            </small>
          </span>
        </div>
        <div>
          <Button variant="ghost" aria-label="Undo" disabled={!s.past.length} onClick={s.undo}>
            <Undo2 size={17} />
          </Button>
          <Button variant="ghost" aria-label="Redo" disabled={!s.future.length} onClick={s.redo}>
            <Redo2 size={17} />
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await api('/library/designs', { method: 'POST', body: JSON.stringify(d) });
                setMessage('Desain disimpan ke pustaka.');
              } catch (e) {
                setError(e);
              }
              setBusy(false);
            }}
          >
            <Save size={16} />
            <span>Simpan</span>
          </Button>
          <Button disabled={issues.length > 0 || busy} onClick={() => setSubmit(true)}>
            <Send size={16} />
            <span>Konsultasikan</span>
          </Button>
        </div>
      </div>
      <div className="workspace-body">
        <aside className="studio-tools">
          <div className="tool-brand">
            <Badge tone={t.studio === 'fashion' ? 'purple' : 'green'}>
              {t.studio === 'fashion' ? 'FASHION' : 'INTERIOR'} STUDIO
            </Badge>
            <h3>Detail yang bikin beda.</h3>
          </div>
          <div className="tool-tabs">
            {[
              ['produk', 'Produk', SlidersHorizontal],
              ['warna', 'Warna', Palette],
              ['artwork', 'Artwork', Layers],
              ...(canTryOn ? [['avatar', 'Manusia', UserRound]] : []),
            ].map(([key, label, Icon]) => {
              const I = Icon as typeof Box;
              return (
                <button
                  key={String(key)}
                  className={tab === key ? 'active' : ''}
                  onClick={() => {
                    setTab(String(key));
                    setPoseJoint(null);
                    if (key === 'avatar') {
                      setMode('3d');
                      if (!d.avatar) update({ avatar: defaultAvatar(), avatarRecipe: undefined });
                    }
                  }}
                >
                  <I size={17} />
                  {String(label)}
                </button>
              );
            })}
          </div>
          <div className="tool-content">
            {tab === 'avatar' && canTryOn ? (
              <AvatarControls
                profile={d.avatar ?? defaultAvatar()}
                joint={poseJoint}
                onPoseModeChange={setPoseMode}
                onSelectJoint={setPoseJoint}
                onGestureStart={s.beginGesture}
                onGestureEnd={s.endGesture}
                onPreview={(avatar) => s.previewDocument({ ...d, avatar, avatarRecipe: undefined })}
                onChange={(avatar) => update({ avatar, avatarRecipe: undefined })}
              />
            ) : (
              <>
                {tab === 'produk' ? (
                  <>
                    <Field label="Nama desain">
                      <Input value={d.name} onChange={(e) => update({ name: e.target.value })} />
                    </Field>
                    {t.studio === 'fashion' ? (
                      <>
                        <Field label="Ukuran">
                          <Select value={d.size} onChange={(e) => update({ size: e.target.value })}>
                            {t.sizes.map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </Select>
                        </Field>
                        <p className="help-text">
                          Bentuk mengikuti template. Tim produksi memastikan kecocokan ukuran saat
                          konsultasi.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="field-grid">
                          {(['width', 'height', 'depth'] as const).map((key, i) => (
                            <Field key={key} label={['Lebar (cm)', 'Tinggi (cm)', 'Dalam (cm)'][i]}>
                              <Input
                                type="number"
                                min={key === 'depth' ? 1 : 10}
                                max={key === 'height' ? 400 : key === 'width' ? 600 : 150}
                                value={d.dimensions[key] / 10}
                                onChange={(e) =>
                                  update({
                                    dimensions: {
                                      ...d.dimensions,
                                      [key]: Number(e.target.value) * 10,
                                    },
                                  })
                                }
                              />
                            </Field>
                          ))}
                        </div>
                        {['cabinet', 'shelf', 'sideboard'].includes(t.modelKind) && (
                          <>
                            {(['columns', 'shelves', 'doors', 'drawers'] as const).map((key, i) => (
                              <Field
                                key={key}
                                label={['Kolom', 'Ambalan per kolom', 'Pintu', 'Laci'][i]}
                              >
                                <Input
                                  type="number"
                                  min={key === 'columns' ? 1 : 0}
                                  max={8}
                                  value={d[key]}
                                  onChange={(e) => update({ [key]: Number(e.target.value) })}
                                />
                              </Field>
                            ))}
                          </>
                        )}
                        <div className="mini-info">
                          <Box size={17} />
                          {furniturePanels(t, d).length} panel dalam daftar material
                        </div>
                      </>
                    )}
                    <Field label="Jumlah produk">
                      <Input
                        type="number"
                        min={1}
                        max={10000}
                        value={d.quantity}
                        onChange={(e) => update({ quantity: Number(e.target.value), variants: [] })}
                      />
                    </Field>
                    {t.studio === 'fashion' && (
                      <>
                        <Button
                          variant="secondary"
                          className="full"
                          onClick={() =>
                            update({ variants: [...d.variants, { size: d.size, quantity: 1 }] })
                          }
                        >
                          Tambah varian ukuran
                        </Button>
                        {d.variants.map((v, index) => (
                          <div className="variant-row" key={index}>
                            <Select
                              aria-label="Ukuran varian"
                              value={v.size}
                              onChange={(e) =>
                                update({
                                  variants: d.variants.map((x, n) =>
                                    n === index ? { ...x, size: e.target.value } : x,
                                  ),
                                })
                              }
                            >
                              {t.sizes.map((size) => (
                                <option key={size}>{size}</option>
                              ))}
                            </Select>
                            <Input
                              aria-label="Jumlah varian"
                              type="number"
                              min={1}
                              value={v.quantity}
                              onChange={(e) =>
                                update({
                                  variants: d.variants.map((x, n) =>
                                    n === index ? { ...x, quantity: Number(e.target.value) } : x,
                                  ),
                                })
                              }
                            />
                            <button
                              className="icon-button"
                              aria-label="Hapus varian"
                              onClick={() =>
                                update({ variants: d.variants.filter((_, n) => n !== index) })
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                    <Button variant="ghost" onClick={s.reset}>
                      <RotateCcw size={15} /> Reset desain
                    </Button>
                  </>
                ) : tab === 'warna' ? (
                  <>
                    <Field label="Warna utama">
                      <Input
                        type="color"
                        value={d.color}
                        onChange={(e) => update({ color: e.target.value })}
                      />
                    </Field>
                    <div className="swatch-grid">
                      {[
                        '#e6dfd2',
                        '#123f35',
                        '#638177',
                        '#222d32',
                        '#b47654',
                        '#b3a187',
                        '#ded0bf',
                        '#a6a4c9',
                        '#f1f1eb',
                        '#bb9670',
                        '#7b5642',
                        '#7d8a81',
                      ].map((c) => (
                        <button
                          key={c}
                          aria-label={'Pilih warna ' + c}
                          className={d.color === c ? 'selected' : ''}
                          style={{ background: c }}
                          onClick={() => update({ color: c })}
                        />
                      ))}
                    </div>
                    {t.modelKind === 'bag' && (
                      <Field label="Warna tali">
                        <Input
                          type="color"
                          value={d.accentColor}
                          onChange={(e) => update({ accentColor: e.target.value })}
                        />
                      </Field>
                    )}
                    {t.studio === 'interior' && (
                      <Field label="Finishing">
                        <Select
                          value={d.material}
                          onChange={(e) =>
                            update({ material: e.target.value as DesignDocument['material'] })
                          }
                        >
                          <option value="oak">Natural Oak</option>
                          <option value="walnut">Walnut</option>
                          <option value="white">Putih solid</option>
                          <option value="graphite">Graphite</option>
                        </Select>
                      </Field>
                    )}
                    <p className="help-text">
                      Warna layar merupakan preview. Sampel material dikonfirmasi saat konsultasi.
                    </p>
                  </>
                ) : (
                  <>
                    <Field label="Area cetak">
                      <Select
                        value={surface.id}
                        onChange={(e) => {
                          setSurfaceId(e.target.value);
                          setSelected(null);
                        }}
                      >
                        {surfaces.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.label} · {x.width / 10} × {x.height / 10} cm
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <div className="artwork-actions">
                      <Button variant="secondary" onClick={addText}>
                        <Type size={16} /> Teks
                      </Button>
                      <label className="button secondary">
                        <Upload size={16} /> Upload
                        <input
                          hidden
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setBusy(true);
                            try {
                              const a = await upload(file);
                              const ratio = (a.height || 1) / (a.width || 1),
                                width = Math.min(
                                  200,
                                  surface.width * 0.7,
                                  (surface.height * 0.7) / ratio,
                                );
                              const l: ArtworkLayer = {
                                id: crypto.randomUUID(),
                                kind: 'image',
                                surfaceId: surface.id,
                                assetId: a.id,
                                text: '',
                                font: 'sans',
                                color: '#000000',
                                x: 0,
                                y: 0,
                                width,
                                height: width * ratio,
                                rotation: 0,
                                opacity: 1,
                              };
                              update({ layers: [...d.layers, l] });
                              setSelected(l.id);
                              if ((a.width / width) * 25.4 < 150)
                                setMessage(
                                  'Resolusi gambar rendah untuk ukuran ini. Konfirmasikan kualitas cetak saat konsultasi.',
                                );
                            } catch (err) {
                              setError(err);
                            }
                            setBusy(false);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    <p className="help-text">
                      PNG, JPEG, WebP, SVG · maks. 20 MB. Geser layer pada tampilan 2D atau atur
                      koordinat di bawah.
                    </p>
                    <div className="layer-list">
                      {d.layers.map((l, index) => (
                        <button
                          className={selected === l.id ? 'selected' : ''}
                          key={l.id}
                          onClick={() => {
                            setSelected(l.id);
                            setSurfaceId(l.surfaceId);
                          }}
                        >
                          {l.kind === 'text' ? <Type size={15} /> : <Upload size={15} />}
                          <span>
                            {l.kind === 'text' ? l.text : 'Artwork ' + (index + 1)}
                            <small>{surfaces.find((s) => s.id === l.surfaceId)?.label}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                    {layer && (
                      <div className="layer-properties">
                        {layer.kind === 'text' && (
                          <>
                            <Field label="Teks">
                              <Input
                                value={layer.text}
                                onChange={(e) => changeLayer(layer.id, { text: e.target.value })}
                              />
                            </Field>
                            <Field label="Jenis huruf">
                              <Select
                                value={layer.font}
                                onChange={(e) =>
                                  changeLayer(layer.id, {
                                    font: e.target.value as ArtworkLayer['font'],
                                  })
                                }
                              >
                                <option value="sans">Sans</option>
                                <option value="serif">Serif</option>
                                <option value="mono">Mono</option>
                              </Select>
                            </Field>
                            <Field label="Warna teks">
                              <Input
                                type="color"
                                value={layer.color}
                                onChange={(e) => changeLayer(layer.id, { color: e.target.value })}
                              />
                            </Field>
                          </>
                        )}
                        <div className="field-grid">
                          {(['x', 'y', 'width', 'height'] as const).map((key) => (
                            <Field
                              key={key}
                              label={
                                {
                                  x: 'Posisi X (cm)',
                                  y: 'Posisi Y (cm)',
                                  width: 'Lebar (cm)',
                                  height: 'Tinggi (cm)',
                                }[key]
                              }
                            >
                              <Input
                                type="number"
                                step=".1"
                                min={key === 'width' || key === 'height' ? 0.1 : undefined}
                                value={Number((layer[key] / 10).toFixed(2))}
                                onChange={(e) =>
                                  changeLayer(layer.id, { [key]: Number(e.target.value) * 10 })
                                }
                              />
                            </Field>
                          ))}
                        </div>
                        <Field label="Rotasi (°)">
                          <Input
                            type="number"
                            min={-360}
                            max={360}
                            value={layer.rotation}
                            onChange={(e) =>
                              changeLayer(layer.id, { rotation: Number(e.target.value) })
                            }
                          />
                        </Field>
                        <Field label="Opacity">
                          <Input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={layer.opacity}
                            onChange={(e) =>
                              changeLayer(layer.id, { opacity: Number(e.target.value) })
                            }
                          />
                        </Field>
                        <div className="layer-buttons">
                          <Button
                            variant="ghost"
                            aria-label="Duplikat layer"
                            onClick={() => {
                              const id = crypto.randomUUID();
                              update({
                                layers: [
                                  ...d.layers,
                                  { ...layer, id, x: layer.x + 5, y: layer.y + 5 },
                                ],
                              });
                              setSelected(id);
                            }}
                          >
                            <Copy size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            aria-label="Naikkan layer"
                            onClick={() => {
                              const a = [...d.layers],
                                i = a.findIndex((l) => l.id === layer.id);
                              if (i < a.length - 1) {
                                [a[i], a[i + 1]] = [a[i + 1], a[i]];
                                update({ layers: a });
                              }
                            }}
                          >
                            <ChevronUp size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            aria-label="Turunkan layer"
                            onClick={() => {
                              const a = [...d.layers],
                                i = a.findIndex((l) => l.id === layer.id);
                              if (i > 0) {
                                [a[i], a[i - 1]] = [a[i - 1], a[i]];
                                update({ layers: a });
                              }
                            }}
                          >
                            <ChevronDown size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            aria-label="Hapus layer"
                            onClick={() => {
                              update({ layers: d.layers.filter((l) => l.id !== layer.id) });
                              setSelected(null);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </aside>
        <section className="studio-canvas">
          <div className="canvas-mode">
            <button className={mode === '3d' ? 'active' : ''} onClick={() => setMode('3d')}>
              <Box size={16} /> Preview 3D
            </button>
            <button
              className={mode === '2d' ? 'active' : ''}
              onClick={() => {
                setMode('2d');
                setTab('artwork');
              }}
            >
              <Layers size={16} /> Area cetak 2D
            </button>
          </div>
          {mode === '3d' ? (
            <Viewer
              template={t}
              document={d}
              forceWorn={tab === 'avatar'}
              joint={poseJoint}
              onSelectJoint={tab === 'avatar' && poseMode ? setPoseJoint : undefined}
              onAvatarChange={
                tab === 'avatar'
                  ? (avatar) => update({ avatar, avatarRecipe: undefined })
                  : undefined
              }
            />
          ) : (
            <ArtworkCanvas
              surface={surface}
              layers={d.layers.filter((l) => l.surfaceId === surface.id)}
              selected={selected}
              onSelect={setSelected}
              onChange={changeLayer}
            />
          )}
          <div className="canvas-footer">
            <span>{t.name}</span>
            <span>
              {t.studio === 'interior'
                ? Object.values(d.dimensions)
                    .map((n) => n / 10)
                    .join(' × ') + ' cm'
                : d.size}{' '}
              · {d.layers.length} layer artwork
            </span>
          </div>
        </section>
        <aside className="studio-summary">
          <span className="eyebrow">RINGKASAN DESAIN</span>
          <h3>Idemu, mulai terbentuk.</h3>
          <div className="summary-price">
            <small>Estimasi per produk</small>
            <strong>{rupiah(price.unit)}</strong>
            <Badge tone="green">{price.quantity} produk</Badge>
          </div>
          <dl>
            <div>
              <dt>Produk dasar</dt>
              <dd>{rupiah(price.base)}</dd>
            </div>
            {price.material > 0 && (
              <div>
                <dt>Material & edging</dt>
                <dd>{rupiah(price.material)}</dd>
              </div>
            )}
            {price.hardware > 0 && (
              <div>
                <dt>Hardware</dt>
                <dd>{rupiah(price.hardware)}</dd>
              </div>
            )}
            <div>
              <dt>Artwork</dt>
              <dd>{rupiah(price.artwork)}</dd>
            </div>
            <div className="summary-total">
              <dt>Estimasi total</dt>
              <dd>{rupiah(price.total)}</dd>
            </div>
          </dl>
          <p className="help-text">
            Ini estimasi desain. Spesifikasi, ongkir, dan harga final disepakati setelah konsultasi.
          </p>
          {issues.length > 0 ? (
            <div className="notice error">
              {issues.map((x) => (
                <p key={x}>{x}</p>
              ))}
            </div>
          ) : (
            <div className="mini-info">
              <Check size={17} /> Desain siap dikonsultasikan
            </div>
          )}
          <ErrorNotice error={error} />
          {message && (
            <div className="notice">
              {message}
              <button aria-label="Tutup notifikasi" onClick={() => setMessage('')}>
                ×
              </button>
            </div>
          )}
          <Button
            className="full"
            disabled={!!issues.length || busy}
            onClick={() => setSubmit(true)}
          >
            <Send size={16} /> Konsultasikan desain
          </Button>
          <Button
            variant="ghost"
            className="full"
            onClick={() => downloadJson(t.id + '-design.json', d)}
          >
            Ekspor dokumen desain
          </Button>
          <div className="consultation-note">
            <strong>Ngobrol dulu, baru dibuat.</strong>
            <p>Submit → konsultasi WhatsApp → setujui desain final → pembayaran → produksi.</p>
          </div>
        </aside>
      </div>
      {submit && <SubmitDialog document={d} onClose={() => setSubmit(false)} />}
    </div>
  );
}
