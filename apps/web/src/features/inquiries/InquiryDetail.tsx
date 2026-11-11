import { useState } from 'react';
import { MessageCircle, Check, Upload, Download, Send, ArrowRight, FileCheck2 } from 'lucide-react';
import {
  rupiah,
  statusLabels,
  productionBlockers,
  whatsappLink,
  type Inquiry,
} from '@3dmantap/shared';
import { useQuery } from '@tanstack/react-query';
import { api, upload, assetUrl } from '../../lib/api';
import { useSettings } from '../../lib/hooks';
import { Viewer } from '../../components/organisms/Viewer';
import { Button, Field, Input, Select, Badge, ErrorNotice } from '../../components/atoms/ui';
export function InquiryDetail({
  inquiry: i,
  token = '',
  admin = false,
  onRefresh,
}: {
  inquiry: Inquiry;
  token?: string;
  admin?: boolean;
  onRefresh: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [message, setMessage] = useState('');
  const { data: settings } = useSettings();
  const context = { inquiry: i.id, token: admin ? undefined : token };
  const { data: wa } = useQuery({
    queryKey: ['wa', i.id],
    queryFn: () => api<{ url: string | null }>('/inquiries/' + i.id + '/whatsapp?token=' + token),
  });
  const { data: jobs, refetch: refreshJobs } = useQuery({
    queryKey: ['production', i.id],
    queryFn: () =>
      api<{ id: string; status: string; revision: number; error: string | null }[]>(
        '/production/' + i.id + '?token=' + token,
      ),
    refetchInterval: 5000,
  });
  const action = async (url: string, body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      await api(url, { method: 'POST', body: JSON.stringify(body) });
      await onRefresh();
      await refreshJobs();
    } catch (e) {
      setError(e);
    }
    setBusy(false);
  };
  const verified = i.payments
    .filter((p) => p.verified && p.revision === i.revision)
    .reduce((n, p) => n + p.amount, 0);
  const total = i.quote
    ? i.quote.total + i.quote.shipping + i.quote.installation
    : i.estimate.total;
  return (
    <div className="inquiry-detail">
      <div className="inquiry-heading">
        <div>
          <span className="eyebrow">
            {i.code} · REVISI {i.revision}
          </span>
          <h2>{i.document.name}</h2>
          <p>
            {i.estimate.quantity} produk · {i.document.size || 'Ukuran custom'} ·{' '}
            {new Date(i.createdAt).toLocaleDateString('id-ID')}
          </p>
        </div>
        <Badge tone={i.status === 'production' || i.status === 'completed' ? 'green' : 'amber'}>
          {statusLabels[i.status]}
        </Badge>
      </div>
      <div className="inquiry-columns">
        <div>
          <div className="inquiry-viewer">
            <Viewer template={i.template} document={i.document} context={context} />
          </div>
          <div className="consultation-callout">
            <MessageCircle size={24} />
            <div>
              <h3>{admin ? 'Konsultasi pelanggan' : 'Desain sudah masuk ke tim kami.'}</h3>
              <p>
                {admin
                  ? i.customerName + ' · ' + i.phone
                  : 'Lanjutkan lewat WhatsApp untuk menyepakati detail. Membuka WhatsApp tidak langsung memulai produksi.'}
              </p>
              {admin ? (
                <a
                  className="button secondary"
                  href={
                    whatsappLink(
                      i.phone,
                      'Halo ' +
                        i.customerName +
                        ', mari konsultasikan ' +
                        i.code +
                        '. Link penawaran privat: ' +
                        location.origin +
                        '/inquiry/' +
                        i.id +
                        '?token=' +
                        i.accessToken,
                    ) ?? undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Hubungi pelanggan <ArrowRight size={16} />
                </a>
              ) : wa?.url ? (
                <a className="button primary" href={wa.url} target="_blank" rel="noreferrer">
                  Konsultasi via WhatsApp <ArrowRight size={16} />
                </a>
              ) : (
                <p className="help-text">
                  Nomor WhatsApp toko belum dikonfigurasi. Pengajuanmu sudah tercatat; tim bisa
                  menghubungimu.
                </p>
              )}
            </div>
          </div>
          <section className="detail-panel">
            <h3>Catatan & progres</h3>
            <p>{i.notes || 'Belum ada catatan tambahan.'}</p>
            {i.consultation.map((n) => (
              <div className="timeline-note" key={n.id}>
                <span className="timeline-dot" />
                <div>
                  <small>
                    {new Date(n.createdAt).toLocaleString('id-ID')} ·{' '}
                    {n.kind === 'progress' ? 'Progres produksi' : 'Konsultasi'}
                  </small>
                  <p>{n.text}</p>
                  {n.assetId && (
                    <img
                      className="progress-photo"
                      src={assetUrl(n.assetId, context)}
                      alt="Progres produksi"
                    />
                  )}
                </div>
              </div>
            ))}
            {admin && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget),
                    file = f.get('photo');
                  let assetId: undefined | string;
                  try {
                    if (file instanceof File && file.size)
                      assetId = (await upload(file, 'progress')).id;
                    await action('/admin/inquiries/' + i.id + '/note', {
                      text: f.get('note'),
                      kind: f.get('kind'),
                      assetId,
                    });
                  } catch (err) {
                    setError(err);
                  }
                }}
              >
                <Field label="Hasil konsultasi / progres">
                  <textarea className="input" name="note" required rows={3} />
                </Field>
                <div className="field-grid">
                  <Select name="kind">
                    <option value="note">Catatan konsultasi</option>
                    <option value="progress">Progres produksi</option>
                  </Select>
                  <Input name="photo" type="file" accept="image/png,image/jpeg,image/webp" />
                </div>
                <Button disabled={busy} variant="secondary">
                  <Send size={15} /> Tambah catatan
                </Button>
              </form>
            )}
          </section>
        </div>
        <div>
          <section className="detail-panel">
            <h3>{i.quote ? 'Penawaran final' : 'Estimasi pengajuan'}</h3>
            <dl className="quote-lines">
              <div>
                <dt>Produk</dt>
                <dd>{rupiah(i.quote?.total ?? i.estimate.total)}</dd>
              </div>
              {i.quote && (
                <>
                  <div>
                    <dt>Pengiriman</dt>
                    <dd>{rupiah(i.quote.shipping)}</dd>
                  </div>
                  <div>
                    <dt>Pemasangan</dt>
                    <dd>{rupiah(i.quote.installation)}</dd>
                  </div>
                  <div>
                    <dt>Pengerjaan</dt>
                    <dd>{i.quote.leadDays} hari</dd>
                  </div>
                  <div>
                    <dt>Penerimaan</dt>
                    <dd>{i.quote.fulfillment === 'pickup' ? 'Ambil di toko' : 'Dikirim'}</dd>
                  </div>
                </>
              )}
              <div className="summary-total">
                <dt>Total</dt>
                <dd>{rupiah(total)}</dd>
              </div>
            </dl>
            {i.quote ? (
              <>
                <p>{i.quote.notes}</p>
                <div className="mini-info">
                  <FileCheck2 size={17} /> Persetujuan{' '}
                  {i.approvedRevision === i.revision ? 'sudah tercatat' : 'menunggu pelanggan'}
                </div>
                {!admin && i.status === 'awaiting_approval' && (
                  <Button
                    className="full"
                    disabled={busy}
                    onClick={() =>
                      action('/inquiries/' + i.id + '/approve?token=' + token, {
                        revision: i.revision,
                      })
                    }
                  >
                    <Check size={16} /> Setujui desain & penawaran revisi {i.revision}
                  </Button>
                )}
              </>
            ) : (
              <p className="help-text">
                Harga final, metode penerimaan, dan pembayaran ditentukan setelah konsultasi.
              </p>
            )}
          </section>
          {i.quote && (
            <section className="detail-panel">
              <h3>Pembayaran transfer</h3>
              <p>
                Prabayar sebelum produksi: <strong>{rupiah(i.quote.requiredPayment)}</strong>
              </p>
              <p>
                Sudah diverifikasi: <strong>{rupiah(verified)}</strong>
              </p>
              {settings?.bankAccount && (
                <div className="bank-card">
                  <strong>{settings.bankName}</strong>
                  <span>{settings.bankAccount}</span>
                  <small>a.n. {settings.bankOwner}</small>
                </div>
              )}
              {i.payments.map((p) => (
                <div className="payment-record" key={p.id}>
                  <div>
                    <strong>{rupiah(p.amount)}</strong>
                    <small>Revisi {p.revision}</small>
                    <Badge tone={p.verified ? 'green' : 'amber'}>
                      {p.verified ? 'Terverifikasi' : 'Menunggu verifikasi'}
                    </Badge>
                  </div>
                  <a target="_blank" rel="noreferrer" href={assetUrl(p.assetId, context)}>
                    Lihat bukti
                  </a>
                  {admin && !p.verified && p.revision === i.revision && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        action('/admin/inquiries/' + i.id + '/payments/' + p.id + '/verify', {})
                      }
                    >
                      Verifikasi
                    </Button>
                  )}
                </div>
              ))}
              {!admin &&
                i.approvedRevision === i.revision &&
                !['completed', 'cancelled'].includes(i.status) && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget),
                        file = f.get('proof');
                      if (!(file instanceof File) || !file.size) return;
                      setBusy(true);
                      try {
                        const a = await upload(file, 'proof');
                        await action('/inquiries/' + i.id + '/payments?token=' + token, {
                          assetId: a.id,
                          amount: Number(f.get('amount')),
                          revision: i.revision,
                        });
                      } catch (err) {
                        setError(err);
                      }
                      setBusy(false);
                    }}
                  >
                    <Field label="Nominal transfer (Rp)">
                      <Input
                        name="amount"
                        type="number"
                        min={1}
                        required
                        defaultValue={Math.max(1, i.quote.requiredPayment - verified)}
                      />
                    </Field>
                    <Field label="Bukti transfer">
                      <Input
                        type="file"
                        name="proof"
                        accept="image/png,image/jpeg,image/webp"
                        required
                      />
                    </Field>
                    <Button disabled={busy} className="full" variant="secondary">
                      <Upload size={16} /> Upload bukti transfer
                    </Button>
                  </form>
                )}
            </section>
          )}
          {admin && (
            <section className="detail-panel admin-actions">
              <h3>Kelola pesanan</h3>
              {!['production', 'ready', 'shipped', 'completed', 'cancelled'].includes(i.status) && (
                <>
                  <details>
                    <summary>Buat / revisi penawaran final</summary>
                    <form
                      key={i.revision}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        void action('/admin/inquiries/' + i.id + '/quote', {
                          total: Number(f.get('total')),
                          requiredPayment: Number(f.get('deposit')),
                          shipping: Number(f.get('shipping')),
                          installation: Number(f.get('installation')),
                          fulfillment: f.get('fulfillment'),
                          leadDays: Number(f.get('days')),
                          notes: f.get('notes'),
                          adminApproved: true,
                        });
                      }}
                    >
                      <Field label="Harga produk final (Rp)">
                        <Input
                          name="total"
                          type="number"
                          min={1}
                          required
                          defaultValue={i.quote?.total ?? i.estimate.total}
                        />
                      </Field>
                      <Field label="Pembayaran wajib sebelum produksi (Rp)">
                        <Input
                          name="deposit"
                          type="number"
                          min={1}
                          required
                          defaultValue={
                            i.quote?.requiredPayment ?? Math.round(i.estimate.total * 0.5)
                          }
                        />
                      </Field>
                      <div className="field-grid">
                        <Field label="Ongkir (Rp)">
                          <Input
                            name="shipping"
                            type="number"
                            min={0}
                            defaultValue={i.quote?.shipping ?? 0}
                          />
                        </Field>
                        <Field label="Pasang (Rp)">
                          <Input
                            name="installation"
                            type="number"
                            min={0}
                            defaultValue={i.quote?.installation ?? 0}
                          />
                        </Field>
                      </div>
                      <Field label="Penerimaan">
                        <Select
                          name="fulfillment"
                          defaultValue={i.quote?.fulfillment ?? 'shipping'}
                        >
                          <option value="shipping">Dikirim</option>
                          <option value="pickup">Ambil di toko</option>
                        </Select>
                      </Field>
                      <Field label="Estimasi pengerjaan (hari)">
                        <Input
                          name="days"
                          type="number"
                          min={1}
                          defaultValue={
                            i.quote?.leadDays ?? (i.template.studio === 'fashion' ? 7 : 21)
                          }
                        />
                      </Field>
                      <Field label="Spesifikasi / kesepakatan">
                        <textarea
                          name="notes"
                          className="input"
                          rows={3}
                          required
                          defaultValue={i.quote?.notes ?? ''}
                        />
                      </Field>
                      <Button disabled={busy} className="full">
                        Terbitkan penawaran revisi baru
                      </Button>
                    </form>
                  </details>
                  <details>
                    <summary>Revisi dokumen desain</summary>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        try {
                          const document = JSON.parse(
                            String(new FormData(e.currentTarget).get('document')),
                          );
                          void action('/admin/inquiries/' + i.id + '/revise', document);
                        } catch (err) {
                          setError(err);
                        }
                      }}
                    >
                      <textarea
                        className="input code-input"
                        name="document"
                        rows={10}
                        defaultValue={JSON.stringify(i.document, null, 2)}
                      />
                      <Button disabled={busy}>Simpan revisi desain</Button>
                    </form>
                  </details>
                </>
              )}
              {i.status === 'awaiting_payment' && (
                <>
                  <Button
                    className="full"
                    disabled={busy || productionBlockers(i).length > 0}
                    onClick={() => action('/admin/inquiries/' + i.id + '/production', {})}
                  >
                    Mulai produksi & buat paket kerja <ArrowRight size={16} />
                  </Button>
                  {productionBlockers(i).map((x) => (
                    <small key={x} className="gate-message">
                      {x}
                    </small>
                  ))}
                </>
              )}
              {(['submitted', 'production', 'ready', 'shipped'] as const).includes(
                i.status as 'submitted',
              ) && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    action('/admin/inquiries/' + i.id + '/status', {
                      status: (
                        {
                          submitted: 'consulting',
                          production: 'ready',
                          ready: i.quote?.fulfillment === 'pickup' ? 'completed' : 'shipped',
                          shipped: 'completed',
                        } as Record<string, string>
                      )[i.status],
                    })
                  }
                >
                  Lanjut status:{' '}
                  {
                    (
                      {
                        submitted: 'Konsultasi',
                        production: 'Siap kirim / ambil',
                        ready: i.quote?.fulfillment === 'pickup' ? 'Selesai' : 'Dikirim',
                        shipped: 'Selesai',
                      } as Record<string, string>
                    )[i.status]
                  }
                </Button>
              )}
              {['submitted', 'consulting', 'awaiting_approval', 'awaiting_payment'].includes(
                i.status,
              ) && (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() =>
                    action('/admin/inquiries/' + i.id + '/status', { status: 'cancelled' })
                  }
                >
                  Batalkan pengajuan
                </Button>
              )}
              <details>
                <summary>Kontak & alamat pelanggan</summary>
                <p>
                  {i.customerName}
                  <br />
                  {i.phone}
                  <br />
                  {i.address}
                </p>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      location.origin + '/inquiry/' + i.id + '?token=' + i.accessToken,
                    );
                    setMessage('Link privat pelanggan disalin.');
                  }}
                >
                  Salin link penawaran privat
                </Button>
              </details>
            </section>
          )}
          {(jobs?.length ?? 0) > 0 && (
            <section className="detail-panel">
              <h3>Paket produksi</h3>
              {jobs?.map((j) => (
                <div className="production-record" key={j.id}>
                  <Badge tone={j.status === 'completed' ? 'green' : 'amber'}>
                    Revisi {j.revision} · {j.status}
                  </Badge>
                  {j.error && <p>{j.error}</p>}
                  {j.status === 'completed' && (
                    <a
                      className="button secondary"
                      href={'/api/v1/production/' + i.id + '/' + j.id + '/download?token=' + token}
                    >
                      <Download size={15} /> Download ZIP
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}
          <ErrorNotice error={error} />
          {message && <div className="notice">{message}</div>}
        </div>
      </div>
    </div>
  );
}
