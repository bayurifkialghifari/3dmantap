import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Save, Copy, Trash2, ArrowUpRight, LogOut, FileCheck2 } from 'lucide-react';
import { statusLabels, type SavedDesign, type Inquiry, type RoomProject } from '@3dmantap/shared';
import { api } from '../lib/api';
import { useTemplates, useMe } from '../lib/hooks';
import { ProductIllustration } from '../components/molecules/ProductIllustration';
import { Button, Badge, Loading, ErrorNotice } from '../components/atoms/ui';
export function Library() {
  const { data: me } = useMe(),
    { data: templates } = useTemplates();
  const query = useQuery({
    queryKey: ['library'],
    queryFn: () => api<SavedDesign[]>('/library/designs'),
  });
  const { data: inquiries } = useQuery({
    queryKey: ['my-inquiries'],
    queryFn: () => api<Inquiry[]>('/inquiries'),
  });
  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () =>
      api<{ id: string; document: RoomProject; shareToken: string }[]>('/library/rooms'),
  });
  const client = useQueryClient();
  const [message, setMessage] = useState(''),
    [error, setError] = useState<unknown>();
  return (
    <div className="section library-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">RUANG KREATIF PRIBADIMU</span>
          <h1>Ide yang sudah kamu mulai.</h1>
          <p>
            {me?.user
              ? 'Halo ' + me.user.name + '. Semua desain dan pengajuanmu ada di sini.'
              : 'Pustaka perangkatmu. Masuk untuk menyimpan desain dengan akun.'}
          </p>
        </div>
        {me?.user ? (
          <Button
            variant="secondary"
            onClick={async () => {
              await api('/auth/sign-out', { method: 'POST', body: '{}' });
              await client.invalidateQueries();
            }}
          >
            <LogOut size={15} /> Keluar
          </Button>
        ) : (
          <Link to="/login" className="button primary">
            Masuk / daftar <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      {message && <div className="notice">{message}</div>}
      <ErrorNotice error={error ?? query.error} />
      <h2 className="library-subtitle">
        <Save size={20} /> Desain tersimpan
      </h2>
      {query.isPending ? (
        <Loading />
      ) : !query.data?.length ? (
        <div className="empty">
          <Save size={30} />
          <p>Belum ada desain tersimpan. Mulai dari template favoritmu.</p>
          <Link to="/catalog/$studio" params={{ studio: 'fashion' }} className="button secondary">
            Jelajahi template
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {query.data.map((d) => {
            const t = templates?.find((t) => t.id === d.document.templateId);
            return (
              <article className="saved-card" key={d.id}>
                {t && (
                  <div className="product-art">
                    <ProductIllustration template={{ ...t, color: d.document.color }} />
                  </div>
                )}
                <div className="saved-info">
                  <h3>{d.name}</h3>
                  <small>{new Date(d.updatedAt).toLocaleDateString('id-ID')}</small>
                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        localStorage.setItem(
                          '3dmantap:draft:' + d.document.templateId,
                          JSON.stringify({
                            state: { document: d.document, past: [], future: [] },
                            version: 0,
                          }),
                        );
                        window.location.href = '/studio/' + d.document.templateId;
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Salin link preview"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          location.origin + '/share/' + d.id + '?token=' + d.shareToken,
                        );
                        setMessage('Link preview disalin.');
                      }}
                    >
                      <Copy size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Duplikat desain"
                      onClick={async () => {
                        try {
                          await api('/library/designs', {
                            method: 'POST',
                            body: JSON.stringify({ ...d.document, name: d.name + ' (salinan)' }),
                          });
                          await client.invalidateQueries({ queryKey: ['library'] });
                        } catch (e) {
                          setError(e);
                        }
                      }}
                    >
                      <Save size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Hapus desain"
                      onClick={async () => {
                        await api('/library/designs/' + d.id, { method: 'DELETE' });
                        await client.invalidateQueries({ queryKey: ['library'] });
                      }}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                  <button
                    className="small-link"
                    onClick={async () => {
                      await api('/library/designs/' + d.id + '/revoke', {
                        method: 'POST',
                        body: '{}',
                      });
                      await client.invalidateQueries({ queryKey: ['library'] });
                      setMessage('Link preview lama dicabut.');
                    }}
                  >
                    Cabut link berbagi
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <h2 className="library-subtitle">
        <Save size={20} /> Ruangan tersimpan
      </h2>
      <div className="inquiry-list">
        {rooms?.map((r) => (
          <div className="inquiry-row" key={r.id}>
            <div>
              <strong>{r.document.name}</strong>
              <span>
                {r.document.items.length} furnitur · {r.document.points.length} dinding
              </span>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                localStorage.setItem('3dmantap:room', JSON.stringify(r.document));
                window.location.href = '/room-planner';
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              aria-label="Bagikan ruangan"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  location.origin + '/room-planner?room=' + r.id + '&token=' + r.shareToken,
                );
                setMessage('Link ruangan disalin.');
              }}
            >
              <Copy size={15} />
            </Button>
            <Button
              variant="ghost"
              aria-label="Hapus ruangan"
              onClick={async () => {
                await api('/library/rooms/' + r.id, { method: 'DELETE' });
                await client.invalidateQueries({ queryKey: ['rooms'] });
              }}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
      </div>
      <h2 className="library-subtitle">
        <FileCheck2 size={20} /> Pengajuan & pesanan
      </h2>
      <div className="inquiry-list">
        {inquiries?.length ? (
          inquiries.map((i) => (
            <a
              key={i.id}
              className="inquiry-row"
              href={'/inquiry/' + i.id + '?token=' + i.accessToken}
            >
              <div>
                <strong>{i.code}</strong>
                <span>{i.document.name}</span>
              </div>
              <Badge tone={i.status === 'completed' ? 'green' : 'neutral'}>
                {statusLabels[i.status]}
              </Badge>
              <ArrowUpRight size={18} />
            </a>
          ))
        ) : (
          <div className="empty small">Pengajuan yang kamu submit akan muncul di sini.</div>
        )}
      </div>
    </div>
  );
}
