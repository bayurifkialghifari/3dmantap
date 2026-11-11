import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  ClipboardList,
  FileClock,
  Search,
  ArrowUpRight,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import {
  starterTemplates,
  statusLabels,
  rupiah,
  type Inquiry,
  type ProductTemplate,
  type BusinessSettings,
} from '@3dmantap/shared';
import { api, upload } from '../lib/api';
import { useMe, useTemplates, useSettings } from '../lib/hooks';
import {
  Button,
  Input,
  Field,
  Badge,
  Modal,
  ErrorNotice,
  Loading,
  Select,
} from '../components/atoms/ui';
import { InquiryDetail } from '../features/inquiries/InquiryDetail';
import { ProductIllustration } from '../components/molecules/ProductIllustration';
export function Admin() {
  const { data: me, isPending: authPending } = useMe();
  const [tab, setTab] = useState('orders'),
    [selected, setSelected] = useState<Inquiry | null>(null),
    [editing, setEditing] = useState<ProductTemplate | null>(null),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [error, setError] = useState<unknown>(),
    [message, setMessage] = useState('');
  const client = useQueryClient();
  const orders = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: () => api<Inquiry[]>('/admin/inquiries'),
    enabled: me?.role === 'admin',
    refetchInterval: 10000,
  });
  const { data: templates } = useTemplates(),
    { data: settings } = useSettings();
  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: () =>
      api<{ id: string; name: string; email: string; role: string }[]>('/admin/customers'),
    enabled: me?.role === 'admin' && tab === 'customers',
  });
  const jobs = useQuery({
    queryKey: ['jobs'],
    queryFn: () =>
      api<
        { id: string; inquiryId: string; revision: number; status: string; error: string | null }[]
      >('/admin/jobs'),
    enabled: me?.role === 'admin' && tab === 'jobs',
    refetchInterval: 5000,
  });
  const audit = useQuery({
    queryKey: ['audit'],
    queryFn: () =>
      api<{ id: string; action: string; targetId: string; createdAt: string }[]>('/admin/audit'),
    enabled: me?.role === 'admin' && tab === 'audit',
  });
  if (authPending) return <Loading />;
  if (me?.role !== 'admin')
    return (
      <div className="empty">
        <h2>Ruang khusus pengelola.</h2>
        <p>Masuk dengan akun admin untuk mengelola bisnis.</p>
        <Link to="/login" className="button primary">
          Masuk
        </Link>
      </div>
    );
  const all = orders.data ?? [],
    list = all
      .filter(
        (i) =>
          (filter === 'all' || i.status === filter) &&
          (i.code + ' ' + i.customerName + ' ' + i.document.name)
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const refresh = async () => {
    const r = await orders.refetch();
    if (selected) setSelected(r.data?.find((i) => i.id === selected.id) ?? null);
    return r;
  };
  return (
    <div className="cms-layout">
      <aside className="cms-sidebar">
        <span className="eyebrow">3DMANTAP / CMS</span>
        <h3>Ruang kendali.</h3>
        {[
          ['orders', 'Pengajuan & pesanan', LayoutDashboard],
          ['templates', 'Produk & template', Package],
          ['customers', 'Pelanggan', Users],
          ['jobs', 'Paket produksi', ClipboardList],
          ['audit', 'Riwayat aktivitas', FileClock],
          ['settings', 'Pengaturan bisnis', Settings],
        ].map(([id, label, Icon]) => {
          const I = Icon as typeof Package;
          return (
            <button
              className={tab === id ? 'active' : ''}
              key={String(id)}
              onClick={() => setTab(String(id))}
            >
              <I size={18} />
              {String(label)}
            </button>
          );
        })}
        <small>
          Konsultasi tercatat.
          <br />
          Produksi terkendali.
        </small>
      </aside>
      <section className="cms-main">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SELAMAT DATANG, ADMIN</span>
            <h1>
              {
                (
                  {
                    orders: 'Dari ide sampai jadi.',
                    templates: 'Koleksi untuk setiap ide.',
                    customers: 'Kenali pelangganmu.',
                    jobs: 'Siap untuk tim produksi.',
                    audit: 'Setiap langkah tercatat.',
                    settings: 'Bisnis kamu, aturannya kamu.',
                  } as Record<string, string>
                )[tab]
              }
            </h1>
          </div>
          <Badge tone="green">CMS AKTIF</Badge>
        </div>
        <ErrorNotice error={error ?? orders.error} />
        {message && <div className="notice">{message}</div>}
        {tab === 'orders' ? (
          <>
            <div className="stat-grid">
              {[
                ['Total pengajuan', all.length],
                [
                  'Perlu konsultasi',
                  all.filter((i) => ['submitted', 'consulting'].includes(i.status)).length,
                ],
                ['Dalam produksi', all.filter((i) => i.status === 'production').length],
                ['Pesanan selesai', all.filter((i) => i.status === 'completed').length],
              ].map(([label, value]) => (
                <article key={String(label)}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>
            <div className="catalog-controls">
              <div className="search-box">
                <Search size={17} />
                <Input
                  aria-label="Cari pengajuan"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nomor, pelanggan, atau desain…"
                />
              </div>
              <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Semua status</option>
                {Object.entries(statusLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pengajuan</th>
                    <th>Pelanggan</th>
                    <th>Produk</th>
                    <th>Estimasi / final</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => (
                    <tr key={i.id} onClick={() => setSelected(i)}>
                      <td>
                        <strong>{i.code}</strong>
                        <small>{new Date(i.createdAt).toLocaleDateString('id-ID')}</small>
                      </td>
                      <td>
                        {i.customerName}
                        <small>{i.phone}</small>
                      </td>
                      <td>
                        {i.document.name}
                        <small>
                          {i.estimate.quantity} produk · revisi {i.revision}
                        </small>
                      </td>
                      <td>{rupiah(i.quote?.total ?? i.estimate.total)}</td>
                      <td>
                        <Badge tone={i.status === 'production' ? 'green' : 'neutral'}>
                          {statusLabels[i.status]}
                        </Badge>
                      </td>
                      <td>
                        <button className="icon-button" aria-label={'Buka ' + i.code}>
                          <ArrowUpRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!list.length && (
                <div className="empty">
                  Pengajuan pelanggan akan masuk di sini sebelum konsultasi WhatsApp.
                </div>
              )}
            </div>
          </>
        ) : tab === 'templates' ? (
          <>
            <div className="section-heading">
              <p>Template aktif harus memiliki model dan area cetak yang valid.</p>
              <Button
                onClick={() =>
                  setEditing({
                    ...starterTemplates[0],
                    id: 'product-' + Date.now().toString(36),
                    slug: 'new-product',
                    name: 'Produk baru',
                    active: false,
                    demo: false,
                  })
                }
              >
                <Plus size={16} /> Tambah produk
              </Button>
            </div>
            <div className="product-grid cms-products">
              {templates?.map((t) => (
                <article className="saved-card" key={t.id}>
                  <div className="product-art">
                    <ProductIllustration template={t} />
                  </div>
                  <div className="saved-info">
                    <Badge tone={t.active ? 'green' : 'neutral'}>
                      {t.active ? 'Aktif' : 'Draft'}
                    </Badge>
                    <h3>{t.name}</h3>
                    <small>
                      {t.category} · {t.studio}
                    </small>
                    <Button variant="secondary" onClick={() => setEditing(t)}>
                      Edit template
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : tab === 'settings' && settings ? (
          <form
            className="settings-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const f = new FormData(e.currentTarget),
                  data = Object.fromEntries(f) as BusinessSettings;
                await api('/settings', { method: 'PUT', body: JSON.stringify(data) });
                await client.invalidateQueries({ queryKey: ['settings'] });
                setMessage('Pengaturan bisnis disimpan.');
              } catch (e) {
                setError(e);
              }
            }}
          >
            <h3>Identitas & konsultasi</h3>
            {[
              ['name', 'Nama bisnis'],
              ['whatsapp', 'WhatsApp toko (format 628…)'],
              ['address', 'Alamat toko'],
              ['announcement', 'Pesan bisnis'],
              ['bankName', 'Nama bank'],
              ['bankAccount', 'Nomor rekening'],
              ['bankOwner', 'Pemilik rekening'],
            ].map(([name, label]) => (
              <Field key={name} label={label}>
                <Input
                  name={name}
                  defaultValue={settings[name as keyof BusinessSettings]}
                  required={name === 'name'}
                />
              </Field>
            ))}
            <p className="help-text">
              Nomor WhatsApp yang kosong menonaktifkan tombol konsultasi; pengajuan tetap masuk CMS.
            </p>
            <Button>Simpan pengaturan</Button>
          </form>
        ) : tab === 'customers' ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Peran</th>
                </tr>
              </thead>
              <tbody>
                {customers.data?.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>
                      <Badge>{c.role}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'jobs' ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Revisi</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {jobs.data?.map((j) => (
                  <tr key={j.id}>
                    <td>{j.id.slice(0, 8)}</td>
                    <td>{j.revision}</td>
                    <td>
                      <Badge tone={j.status === 'completed' ? 'green' : 'amber'}>{j.status}</Badge>
                    </td>
                    <td>{j.error ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'audit' ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Tindakan</th>
                  <th>Pengajuan</th>
                </tr>
              </thead>
              <tbody>
                {audit.data?.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.createdAt).toLocaleString('id-ID')}</td>
                    <td>{a.action}</td>
                    <td>{a.targetId.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      {selected && (
        <div className="cms-detail-overlay">
          <div className="cms-detail-bar">
            <strong>{selected.code}</strong>
            <button
              className="icon-button"
              aria-label="Tutup detail"
              onClick={() => setSelected(null)}
            >
              <X size={20} />
            </button>
          </div>
          <InquiryDetail inquiry={selected} admin onRefresh={refresh} />
        </div>
      )}
      {editing && (
        <TemplateEditor
          template={editing}
          onClose={() => setEditing(null)}
          onSave={async () => {
            await client.invalidateQueries({ queryKey: ['templates'] });
            setEditing(null);
            setMessage('Template disimpan.');
          }}
        />
      )}
    </div>
  );
}
function TemplateEditor({
  template: t,
  onClose,
  onSave,
}: {
  template: ProductTemplate;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const [data, setData] = useState(t),
    [advanced, setAdvanced] = useState(JSON.stringify(t, null, 2)),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false);
  const update = (patch: Partial<ProductTemplate>) => {
    const next = { ...data, ...patch };
    setData(next);
    setAdvanced(JSON.stringify(next, null, 2));
  };
  return (
    <Modal title="Edit produk & template" onClose={onClose} wide>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const doc = JSON.parse(advanced);
            await api('/templates/' + doc.id, { method: 'PUT', body: JSON.stringify(doc) });
            await onSave();
          } catch (err) {
            setError(err);
          }
          setBusy(false);
        }}
      >
        <div className="field-grid">
          <Field label="Nama produk">
            <Input value={data.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Kategori">
            <Input value={data.category} onChange={(e) => update({ category: e.target.value })} />
          </Field>
          <Field label="Studio">
            <Select
              value={data.studio}
              onChange={(e) => update({ studio: e.target.value as ProductTemplate['studio'] })}
            >
              <option value="fashion">Fashion</option>
              <option value="interior">Interior</option>
            </Select>
          </Field>
          <Field label="Harga dasar (Rp)">
            <Input
              type="number"
              min={0}
              value={data.basePrice}
              onChange={(e) => update({ basePrice: Number(e.target.value) })}
            />
          </Field>
        </div>
        <Field label="Model awal">
          <Select
            value={data.modelKind}
            onChange={(e) => update({ modelKind: e.target.value as ProductTemplate['modelKind'] })}
          >
            {[
              'shirt',
              'hoodie',
              'jacket',
              'pants',
              'cap',
              'shoe',
              'bag',
              'cabinet',
              'shelf',
              'desk',
              'door',
              'panel',
              'sideboard',
            ].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </Field>
        <Field
          label="Upload model GLB sendiri"
          hint="Model memakai satuan meter, posisi dasar di Y=0; area cetak dikonfigurasi dalam mm."
        >
          <Input
            type="file"
            accept=".glb"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file)
                try {
                  update({ glbAssetId: (await upload(file, 'model')).id });
                } catch (err) {
                  setError(err);
                }
            }}
          />
        </Field>
        {data.glbAssetId && (
          <p className="help-text">
            <Upload size={14} /> Model {data.glbAssetId.slice(0, 8)} tersimpan.
          </p>
        )}
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={data.active}
            onChange={(e) => update({ active: e.target.checked })}
          />{' '}
          Aktifkan di katalog
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={data.demo}
            onChange={(e) => update({ demo: e.target.checked })}
          />{' '}
          Template / harga contoh
        </label>
        <details>
          <summary>Konfigurasi lengkap: ukuran, area cetak, tarif, model</summary>
          <p className="help-text">
            Ubah dokumen template; backend memvalidasi semua properti sebelum disimpan.
          </p>
          <textarea
            className="input code-input"
            rows={18}
            value={advanced}
            onChange={(e) => setAdvanced(e.target.value)}
          />
        </details>
        <ErrorNotice error={error} />
        <Button disabled={busy} className="full">
          {busy ? 'Menyimpan…' : 'Simpan template'}
        </Button>
      </form>
    </Modal>
  );
}
