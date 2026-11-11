import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { Inquiry as InquiryData, ProductTemplate, DesignDocument } from '@3dmantap/shared';
import { api } from '../lib/api';
import { InquiryDetail } from '../features/inquiries/InquiryDetail';
import { Viewer } from '../components/organisms/Viewer';
import { Loading, ErrorNotice, Badge } from '../components/atoms/ui';
import { useTemplates } from '../lib/hooks';
export function Inquiry() {
  const { id } = useParams({ strict: false });
  const token =
    new URLSearchParams(location.search).get('token') ??
    localStorage.getItem('3dmantap:inquiry:' + id) ??
    '';
  const q = useQuery({
    queryKey: ['inquiry', id, token],
    queryFn: () => api<InquiryData>('/inquiries/' + id + '?token=' + token),
    refetchInterval: 10000,
  });
  return (
    <div className="section inquiry-page">
      {q.isPending ? (
        <Loading />
      ) : q.data ? (
        <InquiryDetail inquiry={q.data} token={token} onRefresh={q.refetch} />
      ) : (
        <ErrorNotice error={q.error} />
      )}
    </div>
  );
}
export function Preview() {
  const { id } = useParams({ strict: false }),
    token = new URLSearchParams(location.search).get('token') ?? '',
    shared = location.pathname.startsWith('/share/');
  const { data: templates } = useTemplates();
  const q = useQuery({
    queryKey: ['preview', id, token],
    queryFn: () =>
      api<{ document: DesignDocument; template?: ProductTemplate; code?: string }>(
        shared
          ? '/library/share/' + id + '?token=' + token
          : '/inquiries/preview/' + id + '?token=' + token,
      ),
  });
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorNotice error={q.error} />;
  const t = q.data.template ?? templates?.find((t) => t.id === q.data.document.templateId);
  return (
    <div className="section public-preview">
      <Badge tone="green">PREVIEW DESAIN · HANYA LIHAT</Badge>
      <h1>{q.data.document.name}</h1>
      <p>{q.data.code ?? 'Desain dibagikan dari 3DMantap'}</p>
      {t && (
        <div className="shared-viewer">
          <Viewer
            template={t}
            document={q.data.document}
            context={shared ? { design: id, token } : { inquiry: id, token }}
          />
        </div>
      )}
      <p className="help-text">
        Preview ini tidak memberikan akses ke data pelanggan, pembayaran, atau file produksi.
      </p>
    </div>
  );
}
